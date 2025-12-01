'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCurrentUser } from '@/lib/firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { updateDocument, Document } from '@/lib/firebase/firestore';
import { uploadFile } from '@/lib/firebase/storage';
import { Pen, Save, Download, Menu, X, FileCheck } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';
import DocumentViewer, { Annotation, Signature } from '@/components/DocumentViewer';
import DocumentSidebar from '@/components/DocumentSidebar';
import SignatureModal from '@/components/SignatureModal';
import SuccessModal from '@/components/SuccessModal';
import ApprovalModal from '@/components/ApprovalModal';
import { Timestamp } from 'firebase/firestore';

export default function DocumentPage() {
    const params = useParams();
    const router = useRouter();
    const [document, setDocument] = useState<Document | null>(null);
    const [loading, setLoading] = useState(true);
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [signatures, setSignatures] = useState<Signature[]>([]);
    const [activeTool, setActiveTool] = useState<string | null>('comment');
    const [showTools, setShowTools] = useState(true);
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [pendingSignature, setPendingSignature] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [comments, setComments] = useState<Array<{
        id: string;
        author: string;
        avatar?: string;
        time: string;
        text: string;
    }>>([]);

    useEffect(() => {
        const loadDocument = async () => {
            const user = await getCurrentUser();
            if (!user) {
                router.push('/auth/login');
                return;
            }

            try {
                if (!db) {
                    throw new Error('Firebase is not configured');
                }
                const docRef = doc(db, 'documents', params.id as string);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = { id: docSnap.id, ...docSnap.data() } as Document;
                    setDocument(data);
                    // Load saved annotations and signatures if any
                    if (data.annotations) {
                        setAnnotations(data.annotations as Annotation[]);
                    }
                    if (data.signatures) {
                        setSignatures(data.signatures as Signature[]);
                    }
                } else {
                    router.push('/dashboard');
                }
            } catch (error) {
                console.error('Error loading document:', error);
                router.push('/dashboard');
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            loadDocument();
        }
    }, [params.id, router]);

    const handleAnnotationAdd = (annotation: Annotation) => {
        setAnnotations([...annotations, annotation]);

        // If it's a comment, add it to comments list
        if (annotation.type === 'comment' && annotation.content) {
            const newComment = {
                id: annotation.id,
                author: 'You', // In real app, get from auth
                time: 'Just now',
                text: annotation.content,
            };
            setComments([newComment, ...comments]);
        }
    };

    const handleSignatureCreate = (imageData: string) => {
        setPendingSignature(imageData);
        // Signature will be placed when user clicks on document
    };

    const handleDocumentClick = async (e: React.MouseEvent<HTMLDivElement>) => {
        if (pendingSignature) {
            const target = e.target as HTMLElement;

            // Don't place signature if clicking on existing signature or annotation
            if (target.closest('img[data-signature]') || target.closest('.annotation-overlay')) {
                return;
            }

            const pageContainer = target.closest('[data-page-container]') as HTMLElement;

            if (pageContainer) {
                const rect = pageContainer.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const pageNumber = parseInt(pageContainer.getAttribute('data-page-number') || '1');

                console.log('Placing signature at:', { x, y, page: pageNumber });

                const newSignature: Signature = {
                    id: Date.now().toString(),
                    x,
                    y,
                    page: pageNumber,
                    imageData: pendingSignature,
                    width: 200,
                    height: 80,
                };

                const newSignatures = [...signatures, newSignature];
                setSignatures(newSignatures);
                setPendingSignature(null);

                // Auto-save signature to Firestore
                if (document?.id) {
                    try {
                        await updateDocument(document.id, {
                            signatures: newSignatures as any,
                        });
                        console.log('Signature saved successfully');
                    } catch (error) {
                        console.error('Error saving signature:', error);
                    }
                }
            } else {
                console.log('No page container found for click');
            }
        }
    };

    const handleAnnotationUpdate = async (updatedAnnotation: Annotation) => {
        const newAnnotations = annotations.map(a =>
            a.id === updatedAnnotation.id ? updatedAnnotation : a
        );
        setAnnotations(newAnnotations);

        if (document?.id) {
            try {
                await updateDocument(document.id, {
                    annotations: newAnnotations as any,
                });
            } catch (error) {
                console.error('Error updating annotation:', error);
            }
        }
    };

    const handleAnnotationDelete = async (id: string) => {
        const newAnnotations = annotations.filter(a => a.id !== id);
        setAnnotations(newAnnotations);

        if (document?.id) {
            try {
                await updateDocument(document.id, {
                    annotations: newAnnotations as any,
                });
            } catch (error) {
                console.error('Error deleting annotation:', error);
            }
        }
    };

    const handleSignatureUpdate = async (updatedSignature: Signature) => {
        const newSignatures = signatures.map(s =>
            s.id === updatedSignature.id ? updatedSignature : s
        );
        setSignatures(newSignatures);

        if (document?.id) {
            try {
                await updateDocument(document.id, {
                    signatures: newSignatures as any,
                });
            } catch (error) {
                console.error('Error updating signature:', error);
            }
        }
    };

    const handleSignatureDelete = async (id: string) => {
        const newSignatures = signatures.filter(s => s.id !== id);
        setSignatures(newSignatures);

        if (document?.id) {
            try {
                await updateDocument(document.id, {
                    signatures: newSignatures as any,
                });
            } catch (error) {
                console.error('Error deleting signature:', error);
            }
        }
    };

    const handleSaveFinal = async () => {
        if (!document) return;

        setSaving(true);
        try {
            const user = await getCurrentUser();
            if (!user) return;

            // For now, we'll save the annotations and signatures to Firestore
            // In a production app, you'd render the PDF with annotations and upload it
            await updateDocument(document.id!, {
                annotations: annotations as any,
                signatures: signatures as any,
                status: 'final',
            });

            setShowSuccess(true);
            // Don't auto-redirect, let user close modal
        } catch (error) {
            console.error('Error saving document:', error);
            alert('Failed to save document');
        } finally {
            setSaving(false);
        }
    };

    const handleApprovalSave = async (data: {
        approvedBySignature: string | null;
        issuedBySignature: string | null;
        approvedBy?: string;
        issuedBy?: string;
    }) => {
        if (!document) return;

        setSaving(true);
        try {
            await updateDocument(document.id!, {
                approvedBySignature: data.approvedBySignature,
                issuedBySignature: data.issuedBySignature,
                approvedBy: data.approvedBy,
                issuedBy: data.issuedBy,
                approvedAt: data.approvedBySignature ? Timestamp.now() : undefined,
                issuedAt: data.issuedBySignature ? Timestamp.now() : undefined,
            });

            // Update local document state
            setDocument({
                ...document,
                approvedBySignature: data.approvedBySignature,
                issuedBySignature: data.issuedBySignature,
                approvedBy: data.approvedBy,
                issuedBy: data.issuedBy,
            });

            setShowSuccess(true);
        } catch (error) {
            console.error('Error saving approval:', error);
            alert('Failed to save approval signatures');
        } finally {
            setSaving(false);
        }
    };

    const handleDownload = async () => {
        if (!document) return;

        try {
            const link = window.document.createElement('a');
            link.href = document.originalUrl;
            link.download = document.fileName;
            window.document.body.appendChild(link);
            link.click();
            window.document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading document:', error);
            alert('Failed to download document');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00A878]"></div>
            </div>
        );
    }

    if (!document) {
        return null;
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            <nav className="bg-white border-b border-gray-200">
                <div className="px-6">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="flex items-center gap-2">
                                <Pen className="w-6 h-6 text-[#00A878]" />
                                <h1 className="text-xl font-bold text-gray-900">Minuty</h1>
                            </Link>
                            <div className="h-6 w-px bg-gray-300"></div>
                            <span className="text-sm text-gray-600 truncate max-w-xs">
                                {document.fileName}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowApprovalModal(true)}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <FileCheck className="w-4 h-4" />
                                Approval
                            </button>
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </button>
                            <button
                                onClick={handleSaveFinal}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-[#00A878] hover:bg-[#008f65] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? 'Saving...' : 'Save Final Version'}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 overflow-hidden">
                    {document && document.originalUrl && (
                        <DocumentViewer
                            url={document.originalUrl}
                            annotations={annotations}
                            onAnnotationAdd={handleAnnotationAdd}
                            onAnnotationUpdate={handleAnnotationUpdate}
                            onAnnotationDelete={handleAnnotationDelete}
                            signatures={signatures}
                            onSignatureAdd={(sig) => setSignatures([...signatures, sig])}
                            onSignatureUpdate={handleSignatureUpdate}
                            onSignatureDelete={handleSignatureDelete}
                            pendingSignature={pendingSignature}
                            onDocumentClick={handleDocumentClick}
                        />
                    )}
                </div>

                <AnimatePresence>
                    {showTools && (
                        <motion.div
                            initial={{ x: 320 }}
                            animate={{ x: 0 }}
                            exit={{ x: 320 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        >
                            <DocumentSidebar
                                activeTool={activeTool}
                                onToolSelect={(tool) => {
                                    setActiveTool(tool);
                                    if (tool === 'sign') {
                                        setShowSignatureModal(true);
                                    }
                                }}
                                onAnnotationAdd={handleAnnotationAdd}
                                onClose={() => setShowTools(false)}
                                comments={comments}
                                document={document}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <SignatureModal
                isOpen={showSignatureModal}
                onClose={() => setShowSignatureModal(false)}
                onSave={handleSignatureCreate}
            />

            <ApprovalModal
                isOpen={showApprovalModal}
                onClose={() => setShowApprovalModal(false)}
                onSave={handleApprovalSave}
                initialData={{
                    approvedBySignature: document.approvedBySignature || null,
                    issuedBySignature: document.issuedBySignature || null,
                    approvedBy: document.approvedBy,
                    issuedBy: document.issuedBy,
                }}
            />

            <SuccessModal
                isOpen={showSuccess}
                onClose={() => {
                    setShowSuccess(false);
                    router.push('/dashboard');
                }}
            />

            {pendingSignature && (
                <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-[#00A878] text-white px-4 py-2 rounded-lg shadow-lg z-40 animate-pulse">
                    Click on the document to place your signature
                </div>
            )}
        </div>
    );
}

