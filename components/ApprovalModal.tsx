'use client';

import { useState } from 'react';
import { X, Check } from 'lucide-react';
import SignatureCapture from './SignatureCapture';

interface ApprovalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: {
        approvedBySignature: string | null;
        issuedBySignature: string | null;
        approvedBy?: string;
        issuedBy?: string;
    }) => void;
    initialData?: {
        approvedBySignature?: string | null;
        issuedBySignature?: string | null;
        approvedBy?: string;
        issuedBy?: string;
    };
}

export default function ApprovalModal({
    isOpen,
    onClose,
    onSave,
    initialData,
}: ApprovalModalProps) {
    const [approvedBySignature, setApprovedBySignature] = useState<string | null>(
        initialData?.approvedBySignature || null
    );
    const [issuedBySignature, setIssuedBySignature] = useState<string | null>(
        initialData?.issuedBySignature || null
    );
    const [approvedBy, setApprovedBy] = useState<string>(initialData?.approvedBy || '');
    const [issuedBy, setIssuedBy] = useState<string>(initialData?.issuedBy || '');

    const handleSave = () => {
        onSave({
            approvedBySignature,
            issuedBySignature,
            approvedBy: approvedBy.trim() || undefined,
            issuedBy: issuedBy.trim() || undefined,
        });
        onClose();
    };

    const handleClose = () => {
        // Reset to initial data on close without saving
        setApprovedBySignature(initialData?.approvedBySignature || null);
        setIssuedBySignature(initialData?.issuedBySignature || null);
        setApprovedBy(initialData?.approvedBy || '');
        setIssuedBy(initialData?.issuedBy || '');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Document Approval
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Approved By Section */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Approved By Name (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={approvedBy}
                                    onChange={(e) => setApprovedBy(e.target.value)}
                                    placeholder="Enter approver name"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#00A878] focus:border-[#00A878] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <SignatureCapture
                                title="Approved By"
                                placeholder="Director signature"
                                value={approvedBySignature}
                                onSignatureChange={setApprovedBySignature}
                                required={true}
                            />
                        </div>

                        {/* Issued By Section */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Issued By Name (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={issuedBy}
                                    onChange={(e) => setIssuedBy(e.target.value)}
                                    placeholder="Enter issuer name"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#00A878] focus:border-[#00A878] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <SignatureCapture
                                title="Issued By"
                                placeholder="Waybill Officer signature"
                                value={issuedBySignature}
                                onSignatureChange={setIssuedBySignature}
                            />
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>Note:</strong> Signatures can be captured using mouse (desktop) or touch (mobile/tablet).
                            The "Approved By" signature is required before submission.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={handleClose}
                            className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!approvedBySignature}
                            className="flex-1 bg-[#00A878] hover:bg-[#008f65] text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Check className="w-5 h-5" />
                            Save Approval
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

