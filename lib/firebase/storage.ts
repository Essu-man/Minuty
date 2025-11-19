import { ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject, getBlob } from 'firebase/storage';
import { storage } from './config';

export const uploadFile = async (
    file: File,
    userId: string,
    path?: string,
    onProgress?: (progress: number) => void
): Promise<string> => {
    if (!storage) {
        throw new Error('Firebase Storage is not configured');
    }

    const fileName = `${Date.now()}_${file.name}`;
    const filePath = path ? `${userId}/${path}/${fileName}` : `${userId}/${fileName}`;
    const storageRef = ref(storage, filePath);

    if (onProgress) {
        // Use resumable upload with progress tracking
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise((resolve, reject) => {
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    onProgress(progress);
                },
                (error) => {
                    reject(error);
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        resolve(downloadURL);
                    } catch (error) {
                        reject(error);
                    }
                }
            );
        });
    } else {
        // Simple upload without progress
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    }
};

export const deleteFile = async (filePath: string): Promise<void> => {
    if (!storage) {
        throw new Error('Firebase Storage is not configured');
    }
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
};

/**
 * Download a file from Firebase Storage as an ArrayBuffer
 * This bypasses CORS issues by using the Firebase SDK
 */
export const downloadFileAsArrayBuffer = async (downloadURL: string): Promise<ArrayBuffer> => {
    if (!storage) {
        throw new Error('Firebase Storage is not configured');
    }

    try {
        // Extract the file path from the download URL
        // URL format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
        const urlObj = new URL(downloadURL);
        const pathMatch = urlObj.pathname.match(/\/o\/(.+)/);

        if (!pathMatch) {
            throw new Error('Invalid Firebase Storage URL format');
        }

        // Decode the path (it's URL encoded, e.g., userId%2Ffilename becomes userId/filename)
        let filePath = decodeURIComponent(pathMatch[1]);

        // Handle multiple levels of encoding
        while (filePath.includes('%')) {
            const decoded = decodeURIComponent(filePath);
            if (decoded === filePath) break; // No more decoding possible
            filePath = decoded;
        }

        const storageRef = ref(storage, filePath);

        // Get the file as a blob, then convert to ArrayBuffer
        const blob = await getBlob(storageRef);
        return await blob.arrayBuffer();
    } catch (error: any) {
        // Fallback: try direct fetch (might still have CORS issues, but worth trying)
        console.warn('Failed to download via Storage SDK, trying direct fetch:', error);
        try {
            const response = await fetch(downloadURL, {
                credentials: 'include',
                mode: 'cors',
            });

            if (!response.ok) {
                throw new Error(`Failed to download file: ${response.statusText}`);
            }

            return await response.arrayBuffer();
        } catch (fetchError: any) {
            // If both methods fail, throw a helpful error
            throw new Error(`Failed to download file. CORS may be blocking the request. Please configure CORS in Firebase Storage settings. Original error: ${error?.message || fetchError?.message}`);
        }
    }
};

