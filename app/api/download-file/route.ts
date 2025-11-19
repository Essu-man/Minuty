import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/firebase/config';
import { ref, getBlob } from 'firebase/storage';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const url = searchParams.get('url');

        if (!url) {
            return NextResponse.json(
                { error: 'URL parameter is required' },
                { status: 400 }
            );
        }

        if (!storage) {
            return NextResponse.json(
                { error: 'Firebase Storage is not configured' },
                { status: 500 }
            );
        }

        try {
            // Extract the file path from the download URL
            const urlObj = new URL(url);
            const pathMatch = urlObj.pathname.match(/\/o\/(.+)/);
            
            if (!pathMatch) {
                throw new Error('Invalid Firebase Storage URL format');
            }

            // Decode the path
            let filePath = decodeURIComponent(pathMatch[1]);
            
            // Handle multiple levels of encoding
            while (filePath.includes('%')) {
                const decoded = decodeURIComponent(filePath);
                if (decoded === filePath) break;
                filePath = decoded;
            }
            
            const storageRef = ref(storage, filePath);
            const blob = await getBlob(storageRef);
            const arrayBuffer = await blob.arrayBuffer();

            // Return the file with appropriate headers
            return new NextResponse(arrayBuffer, {
                headers: {
                    'Content-Type': blob.type || 'application/octet-stream',
                    'Content-Length': arrayBuffer.byteLength.toString(),
                    'Cache-Control': 'public, max-age=3600',
                },
            });
        } catch (storageError: any) {
            console.error('Storage download error:', storageError);
            console.error('Error details:', {
                message: storageError?.message,
                code: storageError?.code,
                stack: storageError?.stack,
            });
            
            // Fallback: try to fetch directly (server-side, no CORS)
            try {
                console.log('Attempting direct fetch fallback for URL:', url);
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0',
                    },
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
                }
                
                const arrayBuffer = await response.arrayBuffer();
                const contentType = response.headers.get('content-type') || 
                    (url.includes('.pdf') ? 'application/pdf' : 
                     url.includes('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                     'application/octet-stream');
                
                console.log('Direct fetch successful, returning file');
                return new NextResponse(arrayBuffer, {
                    headers: {
                        'Content-Type': contentType,
                        'Content-Length': arrayBuffer.byteLength.toString(),
                        'Cache-Control': 'public, max-age=3600',
                    },
                });
            } catch (fetchError: any) {
                console.error('Direct fetch also failed:', fetchError);
                return NextResponse.json(
                    { 
                        error: `Failed to download file: ${storageError?.message || fetchError?.message}`,
                        details: {
                            storageError: storageError?.message,
                            fetchError: fetchError?.message,
                        }
                    },
                    { status: 500 }
                );
            }
        }
    } catch (error: any) {
        console.error('Download route error:', error);
        return NextResponse.json(
            { error: error?.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

