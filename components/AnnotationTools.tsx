'use client';

import { useState } from 'react';
import { MessageSquare, Highlighter, Underline, Pen, X } from 'lucide-react';
import { Annotation } from './DocumentViewer';

interface AnnotationToolsProps {
    activeTool: string | null;
    onToolSelect: (tool: string | null) => void;
    onAnnotationAdd: (annotation: Annotation) => void;
    onClose: () => void;
}

export default function AnnotationTools({
    activeTool,
    onToolSelect,
    onAnnotationAdd,
    onClose,
}: AnnotationToolsProps) {
    const [commentText, setCommentText] = useState('');

    const tools = [
        { id: 'comment', label: 'Comment', icon: MessageSquare },
        { id: 'highlight', label: 'Highlight', icon: Highlighter },
        { id: 'underline', label: 'Underline', icon: Underline },
        { id: 'pen', label: 'Pen', icon: Pen },
    ];

    const handleCommentSubmit = () => {
        if (commentText.trim()) {
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
    };

    return (
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Minuting Tools</h3>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            <div className="p-4 space-y-4">
                <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Tools</p>
                    <div className="grid grid-cols-2 gap-2">
                        {tools.map((tool) => {
                            const Icon = tool.icon;
                            return (
                                <button
                                    key={tool.id}
                                    onClick={() => onToolSelect(activeTool === tool.id ? null : tool.id)}
                                    className={`p-3 rounded-lg border-2 transition-all ${activeTool === tool.id
                                        ? 'border-[#00A878] bg-[#00A878]/10 dark:bg-[#00A878]/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 mx-auto mb-1 ${activeTool === tool.id
                                        ? 'text-[#00A878]'
                                        : 'text-gray-500 dark:text-gray-400'
                                        }`} />
                                    <p className={`text-xs ${activeTool === tool.id
                                        ? 'text-[#00A878] font-semibold'
                                        : 'text-gray-600 dark:text-gray-400'
                                        }`}>
                                        {tool.label}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {activeTool === 'comment' && (
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Add Comment
                        </label>
                        <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Type your comment..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#00A878] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                            rows={4}
                        />
                        <button
                            onClick={handleCommentSubmit}
                            className="mt-2 w-full bg-[#00A878] hover:bg-[#008f65] text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                            Add Comment
                        </button>
                    </div>
                )}

                {activeTool === 'highlight' && (
                    <div className="mt-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Click and drag on the document to highlight text.
                        </p>
                    </div>
                )}

                {activeTool === 'pen' && (
                    <div className="mt-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Click and drag on the document to draw.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

