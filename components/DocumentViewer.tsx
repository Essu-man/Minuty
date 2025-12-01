'use client';

import { useEffect, useRef, useState } from 'react';
import { usePDFjs } from '@/contexts/PDFjsContext';

interface DocumentViewerProps {
    url: string;
    annotations: Annotation[];
    onAnnotationAdd: (annotation: Annotation) => void;
    onAnnotationUpdate?: (annotation: Annotation) => void;
    onAnnotationDelete?: (id: string) => void;
    signatures: Signature[];
    onSignatureAdd: (signature: Signature) => void;
    onSignatureUpdate?: (signature: Signature) => void;
    onSignatureDelete?: (id: string) => void;
    pendingSignature?: string | null;
    onDocumentClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export interface Annotation {
    id: string;
    type: 'comment' | 'highlight' | 'underline' | 'pen';
    x: number;
    y: number;
    page: number;
    content?: string;
    path?: string;
    color?: string;
    width?: number;
    height?: number;
    fontStyle?: string;
    rotation?: number;
}

export interface Signature {
    id: string;
    x: number;
    y: number;
    page: number;
    imageData: string;
    width: number;
    height: number;
}

export default function DocumentViewer({
    url,
    annotations,
    onAnnotationAdd,
    onAnnotationUpdate,
    onAnnotationDelete,
    signatures,
    onSignatureAdd,
    onSignatureUpdate,
    onSignatureDelete,
    pendingSignature,
    onDocumentClick,
}: DocumentViewerProps) {
    const { isReady, pdfjs: contextPdfjs } = usePDFjs();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const pageContainerRef = useRef<HTMLDivElement>(null);
    const [pages, setPages] = useState<any[]>([]);
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [scale, setScale] = useState(1.5);
    const [loading, setLoading] = useState(true);
    const [isDocx, setIsDocx] = useState(false);
    const [docxContent, setDocxContent] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const [pendingAnnotation, setPendingAnnotation] = useState<{ type: string; content?: string } | null>(null);

    // Drag state
    const [dragging, setDragging] = useState<{
        id: string;
        type: 'annotation' | 'signature' | 'resize';
        startX: number;
        startY: number;
        initialX: number;
        initialY: number;
        initialWidth?: number;
        initialHeight?: number;
        page: number;
    } | null>(null);
    const [dragDelta, setDragDelta] = useState({ x: 0, y: 0 });

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');

    const zoomIn = () => {
        setScale((prev) => Math.min(prev + 0.25, 3));
    };

    const zoomOut = () => {
        setScale((prev) => Math.max(prev - 0.25, 0.5));
    };

    const resetZoom = () => {
        setScale(1.5);
    };

    const goToNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, numPages));
    };

    const goToPreviousPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const goToPage = (pageNum: number) => {
        setCurrentPage(Math.max(1, Math.min(pageNum, numPages)));
    };

    const handleDoubleClick = (e: React.MouseEvent, annotation: Annotation) => {
        e.stopPropagation();
        if (annotation.type === 'comment') {
            setEditingId(annotation.id);
            setEditContent(annotation.content || '');
        }
    };

    const handleEditSave = () => {
        if (editingId && onAnnotationUpdate) {
            const annotation = annotations.find(a => a.id === editingId);
            if (annotation) {
                onAnnotationUpdate({ ...annotation, content: editContent });
            }
        }
        setEditingId(null);
        setEditContent('');
    };

    const toggleItalic = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (editingId && onAnnotationUpdate) {
            const annotation = annotations.find(a => a.id === editingId);
            if (annotation) {
                const newStyle = annotation.fontStyle === 'italic' ? 'normal' : 'italic';
                onAnnotationUpdate({ ...annotation, fontStyle: newStyle });
            }
        }
    };

    const rotateComment = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (editingId && onAnnotationUpdate) {
            const annotation = annotations.find(a => a.id === editingId);
            if (annotation) {
                const currentRotation = annotation.rotation || 0;
                let newRotation = currentRotation + 45;
                if (newRotation > 90) newRotation = -45;
                onAnnotationUpdate({ ...annotation, rotation: newRotation });
            }
        }
    };

    const handleDeleteComment = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (editingId && onAnnotationDelete) {
            onAnnotationDelete(editingId);
            setEditingId(null);
            setEditContent('');
        }
    };

    const handleEditKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleEditSave();
        }
        if (e.key === 'Escape') {
            setEditingId(null);
            setEditContent('');
        }
    };

    const handleMouseDown = (e: React.MouseEvent, id: string, type: 'annotation' | 'signature' | 'resize', initialX: number, initialY: number, page: number, initialWidth?: number, initialHeight?: number) => {
        e.stopPropagation();
        e.preventDefault();
        setDragging({
            id,
            type,
            startX: e.clientX,
            startY: e.clientY,
            initialX,
            initialY,
            initialWidth,
            initialHeight,
            page
        });
    };

    // Expose setActiveTool and setPendingAnnotation for parent component
    // This must be called before any conditional returns
    useEffect(() => {
        // Store handlers on window for parent access (temporary solution)
        (window as any).__documentViewerHandlers = {
            setActiveTool,
            setPendingAnnotation,
        };
    }, []); // Empty deps - state setters are stable

    useEffect(() => {
        const loadDocument = async () => {
            try {
                // Check if file is DOCX
                const isDocxFile = url.toLowerCase().includes('.docx') ||
                    url.toLowerCase().includes('wordprocessingml');

                if (isDocxFile) {
                    setIsDocx(true);

                    // Load and convert DOCX to HTML
                    try {
                        const mammoth = await import('mammoth');

                        // Use Next.js API route as proxy to bypass CORS
                        const proxyUrl = `/api/download-file?url=${encodeURIComponent(url)}`;
                        const response = await fetch(proxyUrl);

                        if (!response.ok) {
                            throw new Error(`Failed to download DOCX file: ${response.statusText}`);
                        }

                        const arrayBuffer = await response.arrayBuffer();

                        const result = await mammoth.convertToHtml(
                            { arrayBuffer },
                            {
                                styleMap: [
                                    "p[style-name='Heading 1'] => h1:fresh",
                                    "p[style-name='Heading 2'] => h2:fresh",
                                    "p[style-name='Heading 3'] => h3:fresh",
                                ],
                            }
                        );
                        setDocxContent(result.value);

                        // Handle any warnings
                        if (result.messages.length > 0) {
                            console.warn('DOCX conversion warnings:', result.messages);
                        }
                    } catch (docxError: any) {
                        console.error('Error loading DOCX:', docxError);
                        setError('Failed to load DOCX file. ' + (docxError?.message || ''));
                    }

                    setLoading(false);
                    return;
                }

                // Dynamically import PDF.js only on client side
                if (typeof window === 'undefined') {
                    return;
                }

                // Wait for PDF.js to be ready from context
                if (!isReady) {
                    let attempts = 0;
                    const maxAttempts = 100; // 10 seconds max wait

                    while (!isReady && attempts < maxAttempts) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                        attempts++;
                    }

                    if (!isReady) {
                        throw new Error('PDF.js library not loaded. Please refresh the page and ensure the script loads correctly.');
                    }
                }

                // Use PDF.js from context or window
                let pdfjs = contextPdfjs || (window as any).pdfjsLib;

                if (!pdfjs) {
                    throw new Error('PDF.js library not available. Please refresh the page.');
                }

                // Use API route to proxy PDF URL (helps with CORS and avoids direct URL issues)
                const proxyUrl = `/api/download-file?url=${encodeURIComponent(url)}`;

                // Configure worker
                if (pdfjs.GlobalWorkerOptions) {
                    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
                        pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.394/pdf.worker.min.js';
                    }
                } else {
                    (pdfjs as any).GlobalWorkerOptions = {
                        workerSrc: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.394/pdf.worker.min.js',
                    };
                }

                if (!pdfjs || typeof pdfjs.getDocument !== 'function') {
                    throw new Error('PDF.js library not properly initialized');
                }

                const loadingTask = pdfjs.getDocument({ url: proxyUrl });
                const pdf = await loadingTask.promise;
                const totalPages = pdf.numPages;
                setNumPages(totalPages);
                const pagePromises = [];

                for (let i = 1; i <= totalPages; i++) {
                    pagePromises.push(pdf.getPage(i));
                }

                const loadedPages = await Promise.all(pagePromises);
                setPages(loadedPages);
                setLoading(false);
            } catch (error: any) {
                console.error('Error loading document:', error);
                setError(error?.message || 'Failed to load document');
                setLoading(false);
            }
        };

        if (url) {
            // For DOCX files, load immediately. For PDFs, wait for PDF.js to be ready
            const isDocxFile = url.toLowerCase().includes('.docx') || url.toLowerCase().includes('wordprocessingml');
            if (isDocxFile || isReady) {
                loadDocument();
            }
        }
    }, [url, isReady, contextPdfjs]);

    useEffect(() => {
        const renderCurrentPage = async () => {
            if (!containerRef.current || pages.length === 0 || currentPage < 1 || currentPage > pages.length) return;

            containerRef.current.innerHTML = '';

            const page = pages[currentPage - 1];
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            canvas.className = 'shadow-lg mx-auto bg-white';
            canvas.style.display = 'block';

            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            };

            await page.render(renderContext).promise;

            // Render annotations for current page
            const pageAnnotations = annotations.filter((a) => a.page === currentPage);
            const pageSignatures = signatures.filter((s) => s.page === currentPage);

            // Create overlay for annotations and signatures
            const overlay = document.createElement('div');
            overlay.className = 'absolute annotation-overlay pointer-events-none';
            overlay.style.width = `${viewport.width}px`;
            overlay.style.height = `${viewport.height}px`;
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';

            pageAnnotations.forEach((annotation) => {
                if (annotation.type === 'comment') {
                    const commentDiv = document.createElement('div');
                    commentDiv.className = 'absolute handwritten text-sm p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded pointer-events-auto cursor-move';
                    commentDiv.style.left = `${annotation.x}px`;
                    commentDiv.style.top = `${annotation.y}px`;
                    commentDiv.textContent = annotation.content || '';
                    commentDiv.style.maxWidth = '200px';
                    commentDiv.setAttribute('data-annotation-id', annotation.id);
                    overlay.appendChild(commentDiv);
                } else if (annotation.type === 'highlight') {
                    const highlightDiv = document.createElement('div');
                    highlightDiv.className = 'absolute pointer-events-auto';
                    highlightDiv.style.left = `${annotation.x}px`;
                    highlightDiv.style.top = `${annotation.y}px`;
                    highlightDiv.style.width = '200px';
                    highlightDiv.style.height = '20px';
                    highlightDiv.style.backgroundColor = annotation.color || 'yellow';
                    highlightDiv.style.opacity = '0.3';
                    highlightDiv.setAttribute('data-annotation-id', annotation.id);
                    overlay.appendChild(highlightDiv);
                } else if (annotation.type === 'underline') {
                    const underlineDiv = document.createElement('div');
                    underlineDiv.className = 'absolute pointer-events-auto';
                    underlineDiv.style.left = `${annotation.x}px`;
                    underlineDiv.style.top = `${annotation.y}px`;
                    underlineDiv.style.width = '200px';
                    underlineDiv.style.height = '2px';
                    underlineDiv.style.backgroundColor = annotation.color || 'blue';
                    underlineDiv.setAttribute('data-annotation-id', annotation.id);
                    overlay.appendChild(underlineDiv);
                }
            });

            pageSignatures.forEach((signature) => {
                const sigImg = document.createElement('img');
                sigImg.src = signature.imageData;
                sigImg.className = 'absolute pointer-events-auto cursor-move';
                sigImg.setAttribute('data-signature', 'true');
                sigImg.setAttribute('data-signature-id', signature.id);
                sigImg.style.left = `${signature.x}px`;
                sigImg.style.top = `${signature.y}px`;
                sigImg.style.width = `${signature.width}px`;
                sigImg.style.height = `${signature.height}px`;
                sigImg.style.userSelect = 'none';
                overlay.appendChild(sigImg);
            });

            const pageContainer = document.createElement('div');
            pageContainer.className = 'relative inline-block';
            pageContainer.setAttribute('data-page-container', 'true');
            pageContainer.setAttribute('data-page-number', currentPage.toString());
            pageContainer.style.width = `${viewport.width}px`;
            pageContainer.style.height = `${viewport.height}px`;
            pageContainer.appendChild(canvas);
            pageContainer.appendChild(overlay);
            containerRef.current.appendChild(pageContainer);
        };

        renderCurrentPage();
    }, [pages, scale, annotations, signatures, currentPage]);

    // Drag Logic
    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!dragging) return;

            if (dragging.type === 'resize') {
                const deltaX = e.clientX - dragging.startX;
                setDragDelta({ x: deltaX, y: 0 });
            } else {
                setDragDelta({
                    x: e.clientX - dragging.startX,
                    y: e.clientY - dragging.startY
                });
            }
        };

        const onMouseUp = (e: MouseEvent) => {
            if (!dragging) return;

            if (dragging.type === 'resize' && onAnnotationUpdate) {
                const deltaX = e.clientX - dragging.startX;
                const ann = annotations.find(a => a.id === dragging.id);
                if (ann) {
                    const newWidth = Math.max(20, (dragging.initialWidth || 200) + deltaX);
                    onAnnotationUpdate({ ...ann, width: newWidth });
                }
            } else {
                const finalX = dragging.initialX + (e.clientX - dragging.startX);
                const finalY = dragging.initialY + (e.clientY - dragging.startY);

                if (dragging.type === 'signature' && onSignatureUpdate) {
                    const sig = signatures.find(s => s.id === dragging.id);
                    if (sig) {
                        onSignatureUpdate({ ...sig, x: finalX, y: finalY });
                    }
                } else if (dragging.type === 'annotation' && onAnnotationUpdate) {
                    const ann = annotations.find(a => a.id === dragging.id);
                    if (ann) {
                        onAnnotationUpdate({ ...ann, x: finalX, y: finalY });
                    }
                }
            }

            setDragging(null);
            setDragDelta({ x: 0, y: 0 });
        };

        if (dragging) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [dragging, signatures, annotations, onSignatureUpdate, onAnnotationUpdate]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00A878]"></div>
            </div>
        );
    }

    if (isDocx) {
        return (
            <div className="h-full overflow-auto bg-gray-100 dark:bg-gray-900">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00A878]"></div>
                    </div>
                ) : error ? (
                    <div className="h-full flex items-center justify-center p-8">
                        <div className="max-w-md text-center">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                Error Loading DOCX
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                {error}
                            </p>
                            <a
                                href={url}
                                download
                                className="inline-flex items-center gap-2 px-6 py-3 bg-[#00A878] hover:bg-[#008f65] text-white font-semibold rounded-lg transition-colors"
                            >
                                Download File
                            </a>
                        </div>
                    </div>
                ) : (
                    <>
                        <style dangerouslySetInnerHTML={{
                            __html: `
                                .docx-content p {
                                    margin: 1em 0;
                                    color: rgb(17, 24, 39);
                                }
                                .docx-content h1 {
                                    font-size: 2em;
                                    font-weight: bold;
                                    margin: 1em 0 0.5em 0;
                                    color: rgb(17, 24, 39);
                                }
                                .docx-content h2 {
                                    font-size: 1.5em;
                                    font-weight: bold;
                                    margin: 0.8em 0 0.4em 0;
                                    color: rgb(17, 24, 39);
                                }
                                .docx-content h3 {
                                    font-size: 1.25em;
                                    font-weight: bold;
                                    margin: 0.6em 0 0.3em 0;
                                    color: rgb(17, 24, 39);
                                }
                                .docx-content ul, .docx-content ol {
                                    margin: 1em 0;
                                    padding-left: 2em;
                                }
                                .docx-content li {
                                    margin: 0.5em 0;
                                }
                                .docx-content table {
                                    border-collapse: collapse;
                                    width: 100%;
                                    margin: 1em 0;
                                }
                                .docx-content td, .docx-content th {
                                    border: 1px solid #ddd;
                                    padding: 0.5em;
                                }
                                .docx-content strong {
                                    font-weight: bold;
                                }
                                .docx-content em {
                                    font-style: italic;
                                }
                                .dark .docx-content p,
                                .dark .docx-content h1,
                                .dark .docx-content h2,
                                .dark .docx-content h3 {
                                    color: rgb(229, 231, 235);
                                }
                                .dark .docx-content td,
                                .dark .docx-content th {
                                    border-color: rgb(75, 85, 99);
                                }
                            `
                        }} />
                        <div className="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 shadow-lg my-8 rounded-lg">
                            <div
                                className="docx-content"
                                dangerouslySetInnerHTML={{ __html: docxContent }}
                                style={{
                                    fontFamily: 'system-ui, -apple-system, sans-serif',
                                    lineHeight: '1.8',
                                }}
                            />
                        </div>
                    </>
                )}
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-8">
                <div className="max-w-md text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Error Loading Document
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {error}
                    </p>
                    <a
                        href={url}
                        download
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#00A878] hover:bg-[#008f65] text-white font-semibold rounded-lg transition-colors"
                    >
                        Download File
                    </a>
                </div>
            </div>
        );
    }

    const handleDocumentClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;

        // Don't handle clicks on annotations or signatures
        if (target.closest('.annotation-overlay') || target.closest('img[data-signature]')) {
            return;
        }

        // Handle signature placement first (from parent) - priority over annotations
        if (pendingSignature && onDocumentClick) {
            e.stopPropagation(); // Prevent annotation handling
            onDocumentClick(e);
            return;
        }

        const pageContainer = target.closest('[data-page-container]') as HTMLElement;
        if (!pageContainer) {
            return;
        }

        const rect = pageContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const pageNumber = parseInt(pageContainer.getAttribute('data-page-number') || '1');

        // Handle annotation placement
        if (pendingAnnotation) {
            const newAnnotation: Annotation = {
                id: Date.now().toString(),
                type: pendingAnnotation.type as 'comment' | 'highlight' | 'underline' | 'pen',
                x,
                y,
                page: pageNumber,
                content: pendingAnnotation.content,
                color: pendingAnnotation.type === 'highlight' ? 'yellow' : undefined,
            };
            onAnnotationAdd(newAnnotation);
            setPendingAnnotation(null);
        }
    };

    return (
        <div className="h-full overflow-auto bg-gray-100 dark:bg-gray-900 p-4 relative">
            {/* Zoom Controls */}
            <div className="fixed top-20 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 flex flex-col gap-2 border border-gray-200 dark:border-gray-700">
                <button
                    onClick={zoomIn}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Zoom In"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                </button>
                <button
                    onClick={zoomOut}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Zoom Out"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                </button>
                <button
                    onClick={resetZoom}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-xs"
                    title="Reset Zoom"
                >
                    {Math.round(scale * 100)}%
                </button>
            </div>

            {/* Page Navigation Controls */}
            {numPages > 1 && (
                <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg px-4 py-3 flex items-center gap-4 border border-gray-200 dark:border-gray-700">
                    <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Previous Page"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Page
                        </span>
                        <input
                            type="number"
                            min="1"
                            max={numPages}
                            value={currentPage}
                            onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            of {numPages}
                        </span>
                    </div>

                    <button
                        onClick={goToNextPage}
                        disabled={currentPage === numPages}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Next Page"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            )}

            <div ref={containerRef} className="flex flex-col items-center justify-center min-h-full" onClick={handleDocumentClick}></div>
        </div>
    );
}

