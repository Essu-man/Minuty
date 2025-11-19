'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/firebase/auth';
import { uploadFile } from '@/lib/firebase/storage';
import { createDocument } from '@/lib/firebase/firestore';
import { Pen, Upload as UploadIcon, X, FileText, Bell, User } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface FileItem {
    id: string;
    file: File;
    progress: number;
    status: 'waiting' | 'uploading' | 'complete' | 'error';
    error?: string;
}

export default function UploadPage() {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [uploading, setUploading] = useState(false);
    const [overallProgress, setOverallProgress] = useState(0);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        addFiles(selectedFiles);
    };

    const addFiles = (newFiles: File[]) => {
        const validFiles = newFiles.filter((file) => {
            return (
                file.type === 'application/pdf' ||
                file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                file.name.endsWith('.pdf') ||
                file.name.endsWith('.docx')
            );
        });

        if (validFiles.length !== newFiles.length) {
            setError('Some files were invalid. Only PDF and DOCX files are supported.');
        }

        const newFileItems: FileItem[] = validFiles.map((file) => ({
            id: Date.now().toString() + Math.random(),
            file,
            progress: 0,
            status: 'waiting' as const,
        }));

        setFiles([...files, ...newFileItems]);
        setError('');
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files);
        addFiles(droppedFiles);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const removeFile = (id: string) => {
        setFiles(files.filter((f) => f.id !== id));
    };

    const formatFileSize = (bytes: number) => {
        return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        try {
            const user = await getCurrentUser();
            if (!user) {
                router.push('/auth/login');
                return;
            }

            // Check Firebase Storage configuration
            const { storage, isFirebaseConfigured } = await import('@/lib/firebase/config');
            if (!isFirebaseConfigured()) {
                setError('Firebase is not properly configured. Please check your environment variables.');
                return;
            }
            if (!storage) {
                setError('Firebase Storage is not initialized. Please check your Firebase configuration.');
                return;
            }

            setUploading(true);
            setError('');
            setOverallProgress(0);

            const totalFiles = files.length;
            let completedFiles = 0;
            const errors: string[] = [];

            for (let i = 0; i < files.length; i++) {
                const fileItem = files[i];

                // Update status to uploading
                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === fileItem.id ? { ...f, status: 'uploading' as const, progress: 0 } : f
                    )
                );

                try {
                    console.log(`Starting upload for file: ${fileItem.file.name}`);

                    let fileUrl: string;
                    try {
                        // Upload with progress tracking
                        fileUrl = await uploadFile(
                            fileItem.file,
                            user.uid,
                            undefined,
                            (progress) => {
                                setFiles((prev) =>
                                    prev.map((f) => {
                                        if (f.id === fileItem.id) {
                                            return { ...f, progress: Math.round(progress) };
                                        }
                                        return f;
                                    })
                                );
                            }
                        );
                        console.log(`File uploaded successfully to Storage. URL: ${fileUrl}`);
                    } catch (storageError: any) {
                        console.error('Storage upload error:', storageError);
                        const errorCode = storageError?.code || '';
                        if (errorCode.includes('storage/') || errorCode.includes('unauthorized')) {
                            throw new Error('Storage permission denied. Please check Firebase Storage rules in Firebase Console → Storage → Rules tab.');
                        }
                        throw storageError;
                    }

                    try {
                        // Create document in Firestore
                        const documentData = {
                            userId: user.uid,
                            fileName: fileItem.file.name,
                            originalUrl: fileUrl,
                            status: 'draft' as const,
                        };
                        console.log('Creating Firestore document with data:', documentData);
                        console.log('Current user UID:', user.uid);

                        await createDocument(documentData);
                        console.log(`Document created in Firestore for: ${fileItem.file.name}`);
                    } catch (firestoreError: any) {
                        console.error('Firestore creation error:', firestoreError);
                        console.error('Error code:', firestoreError?.code);
                        console.error('Error message:', firestoreError?.message);
                        const errorCode = firestoreError?.code || '';
                        if (errorCode.includes('permission-denied') || errorCode.includes('PERMISSION_DENIED') || firestoreError?.message?.includes('permission')) {
                            throw new Error('Firestore permission denied. Please check Firestore rules in Firebase Console → Firestore Database → Rules tab.');
                        }
                        throw firestoreError;
                    }

                    // Mark as complete
                    setFiles((prev) =>
                        prev.map((f) =>
                            f.id === fileItem.id
                                ? { ...f, status: 'complete' as const, progress: 100 }
                                : f
                        )
                    );

                    completedFiles++;
                    setOverallProgress((completedFiles / totalFiles) * 100);
                } catch (err: any) {
                    console.error('Error uploading file:', err);
                    const errorCode = err?.code || '';
                    const errorMessage = err?.message || 'Failed to upload file';

                    let userFriendlyMessage = errorMessage;

                    // Provide user-friendly error messages
                    if (errorCode === 'storage/unauthorized' || errorMessage.includes('Storage permission')) {
                        userFriendlyMessage = 'Storage permission denied. Check Firebase Storage rules.';
                    } else if (errorCode === 'storage/canceled') {
                        userFriendlyMessage = 'Upload was canceled.';
                    } else if (errorCode === 'storage/unknown') {
                        userFriendlyMessage = 'Unknown storage error. Check Firebase configuration.';
                    } else if (errorCode === 'permission-denied' || errorCode === 'PERMISSION_DENIED' || errorMessage.includes('Firestore permission')) {
                        userFriendlyMessage = 'Firestore permission denied. Check Firestore Database rules.';
                    } else if (errorMessage.includes('Missing or insufficient permissions')) {
                        // Generic permission error - check both
                        userFriendlyMessage = 'Permission denied. Check both Storage and Firestore rules.';
                    }

                    errors.push(`${fileItem.file.name}: ${userFriendlyMessage}`);
                    setError(errors.join(' | '));

                    // Mark as error instead of waiting
                    setFiles((prev) =>
                        prev.map((f) =>
                            f.id === fileItem.id
                                ? { ...f, status: 'waiting' as const, progress: 0 }
                                : f
                        )
                    );
                }
            }

            setUploading(false);

            if (completedFiles === totalFiles) {
                setTimeout(() => {
                    router.push('/dashboard');
                }, 1000);
            } else if (errors.length > 0) {
                // Show error but don't redirect
                console.error('Upload completed with errors:', errors);
            }
        } catch (error: any) {
            console.error('Error in handleUpload:', error);
            const errorMessage = error?.message || 'An unexpected error occurred. Please try again.';
            setError(errorMessage);
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200">
                <div className="px-6">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-6">
                            <Link href="/dashboard" className="flex items-center gap-2">
                                <Pen className="w-6 h-6 text-[#00A878]" />
                                <h1 className="text-xl font-bold text-gray-900">Minuty</h1>
                            </Link>
                            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                                Dashboard
                            </Link>
                            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                                Documents
                            </Link>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                                <Bell className="w-5 h-5 text-gray-600" />
                            </button>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-semibold">
                                <User className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-6 py-12">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Upload Documents</h2>
                    <p className="text-gray-600">
                        Get started by uploading your documents for minuting and signing.
                    </p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex-1">
                                <p className="text-red-800 font-semibold mb-1">Upload Error</p>
                                <p className="text-red-600 text-sm">{error}</p>
                                {(error.includes('Permission') || error.includes('unauthorized') || error.includes('permission-denied')) ? (
                                    <div className="mt-3 p-3 bg-red-100 rounded border border-red-300">
                                        <p className="text-xs text-red-800 font-semibold mb-2">Troubleshooting Steps:</p>

                                        {error.includes('Storage') || error.includes('storage/') ? (
                                            <div className="mb-3">
                                                <p className="text-xs text-red-800 font-semibold mb-1">1. Fix Firebase Storage Rules:</p>
                                                <ol className="text-xs text-red-700 list-decimal list-inside space-y-1 ml-2">
                                                    <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline">Firebase Console</a></li>
                                                    <li>Select your project → Storage → Rules tab</li>
                                                    <li>Paste this rule and click "Publish":</li>
                                                </ol>
                                                <pre className="mt-2 p-2 bg-red-200 rounded text-xs overflow-x-auto">
                                                    {`rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`}
                                                </pre>
                                            </div>
                                        ) : null}

                                        {error.includes('Firestore') || error.includes('permission-denied') ? (
                                            <div className="mb-3">
                                                <p className="text-xs text-red-800 font-semibold mb-1">2. Fix Firestore Database Rules:</p>
                                                <ol className="text-xs text-red-700 list-decimal list-inside space-y-1 ml-2">
                                                    <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline">Firebase Console</a></li>
                                                    <li>Select your project → Firestore Database → Rules tab</li>
                                                    <li>Paste this rule and click "Publish":</li>
                                                </ol>
                                                <pre className="mt-2 p-2 bg-red-200 rounded text-xs overflow-x-auto">
                                                    {`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /documents/{documentId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update: if request.auth != null && request.auth.uid == resource.data.userId;
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}`}
                                                </pre>
                                            </div>
                                        ) : null}

                                        <div className="mt-3 pt-2 border-t border-red-300">
                                            <p className="text-xs text-red-800 font-semibold mb-1">3. Additional Checks:</p>
                                            <ul className="text-xs text-red-700 list-disc list-inside space-y-1">
                                                <li>Ensure you're logged in with a valid account</li>
                                                <li>Wait 10-30 seconds after publishing rules before retrying</li>
                                                <li>Refresh the page and try uploading again</li>
                                                <li>Check browser console (F12) for detailed error messages</li>
                                            </ul>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                            <button
                                onClick={() => setError('')}
                                className="text-red-600 hover:text-red-800"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-lg p-8 mb-8"
                >
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        className="border-2 border-dashed border-[#00A878] rounded-lg p-12 text-center hover:bg-green-50/50 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.docx"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <div className="w-16 h-16 bg-[#00A878] rounded-full flex items-center justify-center mx-auto mb-4">
                            <UploadIcon className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-lg font-semibold text-gray-900 mb-2">
                            Drag & drop files here
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                            Supports PDF, DOCX. Max file size: 25MB
                        </p>
                        <button
                            type="button"
                            className="px-6 py-2 bg-green-100 hover:bg-green-200 text-[#00A878] font-semibold rounded-lg transition-colors"
                        >
                            Browse files
                        </button>
                    </div>
                </motion.div>

                {files.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                                <span className="text-sm font-semibold text-gray-900">
                                    {Math.round(overallProgress)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${overallProgress}%` }}
                                    className="bg-[#00A878] h-2 rounded-full transition-all"
                                />
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                                Uploading {files.filter((f) => f.status === 'uploading' || f.status === 'complete').length} of {files.length} files...
                            </p>
                        </div>

                        <div className="space-y-3">
                            {files.map((fileItem) => (
                                <div
                                    key={fileItem.id}
                                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <FileText className="w-8 h-8 text-[#00A878] flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">
                                            {fileItem.file.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {formatFileSize(fileItem.file.size)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {fileItem.status === 'complete' ? (
                                            <div className="flex items-center gap-2 text-[#00A878]">
                                                <div className="w-5 h-5 rounded-full bg-[#00A878] flex items-center justify-center">
                                                    <span className="text-white text-xs">✓</span>
                                                </div>
                                                <span className="text-sm font-medium">Complete</span>
                                            </div>
                                        ) : fileItem.status === 'uploading' ? (
                                            <div className="flex items-center gap-3 min-w-[120px]">
                                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-[#00A878] h-2 rounded-full transition-all"
                                                        style={{ width: `${fileItem.progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm text-gray-600">{fileItem.progress}%</span>
                                            </div>
                                        ) : fileItem.status === 'error' ? (
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-sm text-red-600">Error</span>
                                                {fileItem.error && (
                                                    <span className="text-xs text-red-500 max-w-[200px] truncate" title={fileItem.error}>
                                                        {fileItem.error}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400">Waiting...</span>
                                        )}
                                        <button
                                            onClick={() => removeFile(fileItem.id)}
                                            className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                                        >
                                            <X className="w-5 h-5 text-gray-500" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                onClick={handleUpload}
                                disabled={uploading || files.length === 0}
                                className="px-8 py-3 bg-[#00A878] hover:bg-[#008f65] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {uploading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <UploadIcon className="w-5 h-5" />
                                        Start Upload
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
