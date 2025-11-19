'use client';

import { useState } from 'react';
import { MessageSquare, Highlighter, Pen, FileSignature, X } from 'lucide-react';
import { Annotation } from './DocumentViewer';
import SignatureDisplay from './SignatureDisplay';
import { Document } from '@/lib/firebase/firestore';

interface DocumentSidebarProps {
    activeTool: string | null;
    onToolSelect: (tool: string | null) => void;
    onAnnotationAdd: (annotation: Annotation) => void;
    onClose: () => void;
    comments: Array<{
        id: string;
        author: string;
        avatar?: string;
        time: string;
        text: string;
    }>;
    document?: Document | null;
}

export default function DocumentSidebar({
    activeTool,
    onToolSelect,
    onAnnotationAdd,
    onClose,
    comments,
    document,
}: DocumentSidebarProps) {
    const [commentText, setCommentText] = useState('');

    const tools = [
        { id: 'comment', label: 'Comment', icon: MessageSquare },
        { id: 'pen', label: 'Pen', icon: Pen },
        { id: 'highlight', label: 'Highlight', icon: Highlighter },
        { id: 'sign', label: 'Sign', icon: FileSignature },
    ];

    const handleCommentSubmit = () => {
        if (commentText.trim()) {
            // Set pending annotation so it can be placed on click
            if ((window as any).__documentViewerHandlers) {
                (window as any).__documentViewerHandlers.setPendingAnnotation({
                    type: 'comment',
                    content: commentText,
                });
                setCommentText('');
            } else {
                // Fallback: add at default position
                onAnnotationAdd({
                    id: Date.now().toString(),
                    type: 'comment',
                    x: 100,
                    y: 100,
                    page: 1,
                    content: commentText,
                });
                setCommentText('');
            }
        }
    };

    return (
        <div className="w-80 bg-white border-l border-gray-200 h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Tools</h3>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="p-4 border-b border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Tools</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {tools.map((tool) => {
                            const Icon = tool.icon;
                            const isActive = activeTool === tool.id;
                            return (
                                <button
                                    key={tool.id}
                                    onClick={() => {
                                        const newActiveTool = isActive ? null : tool.id;
                                        onToolSelect(newActiveTool);
                                        
                                        // Set pending annotation for highlight/underline tools
                                        if (newActiveTool && (window as any).__documentViewerHandlers) {
                                            if (newActiveTool === 'highlight') {
                                                (window as any).__documentViewerHandlers.setPendingAnnotation({
                                                    type: 'highlight',
                                                });
                                            } else if (newActiveTool === 'pen') {
                                                (window as any).__documentViewerHandlers.setPendingAnnotation({
                                                    type: 'underline',
                                                });
                                            }
                                        }
                                    }}
                                    className={`p-3 rounded-lg border-2 transition-all ${isActive
                                        ? 'border-[#00A878] bg-[#00A878]/10'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <Icon
                                        className={`w-5 h-5 mx-auto mb-1 ${isActive ? 'text-[#00A878]' : 'text-gray-500'
                                            }`}
                                    />
                                    <p
                                        className={`text-xs ${isActive
                                            ? 'text-[#00A878] font-semibold'
                                            : 'text-gray-600'
                                            }`}
                                    >
                                        {tool.label}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Comments</h4>

                    {activeTool === 'comment' && (
                        <div className="mb-4">
                            <textarea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Add a comment..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A878] focus:border-transparent bg-white text-gray-900 resize-none text-sm"
                                rows={3}
                            />
                            <button
                                onClick={handleCommentSubmit}
                                className="mt-2 w-full bg-[#00A878] hover:bg-[#008f65] text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                            >
                                Add Comment
                            </button>
                        </div>
                    )}

                    <div className="space-y-4">
                        {comments.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">
                                No comments yet
                            </p>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                        {comment.avatar ? (
                                            <img
                                                src={comment.avatar}
                                                alt={comment.author}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            comment.author.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-sm font-semibold text-gray-900">
                                                {comment.author}
                                            </p>
                                            <p className="text-xs text-gray-500">{comment.time}</p>
                                        </div>
                                        <p className="text-sm text-gray-700">{comment.text}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Approval Signatures Section */}
                {document && (
                    <div className="p-4 border-t border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Approval Signatures</h4>
                        <div className="space-y-3">
                            <SignatureDisplay
                                title="Approved By"
                                signature={document.approvedBySignature}
                                signerName={document.approvedBy}
                                signedAt={document.approvedAt}
                            />
                            <SignatureDisplay
                                title="Issued By"
                                signature={document.issuedBySignature}
                                signerName={document.issuedBy}
                                signedAt={document.issuedAt}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

