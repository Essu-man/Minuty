'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    message?: string;
    subMessage?: string;
    autoCloseDelay?: number;
}

export default function SuccessModal({
    isOpen,
    onClose,
    message = 'Document Saved Successfully!',
    subMessage = 'Your changes have been saved to the document.',
    autoCloseDelay = 2000,
}: SuccessModalProps) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setProgress(0);
            const interval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setTimeout(() => {
                            onClose();
                        }, 100);
                        return 100;
                    }
                    return prev + 2;
                });
            }, (autoCloseDelay / 100) * 2);

            return () => clearInterval(interval);
        }
    }, [isOpen, autoCloseDelay, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
                    >
                        <div className="p-6">
                            <div className="flex justify-end mb-4">
                                <button
                                    onClick={onClose}
                                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="relative mb-4">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                        <div className="w-12 h-12 bg-[#00A878] rounded-full flex items-center justify-center">
                                            <CheckCircle className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-[#00A878] mb-2">
                                    {message}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {subMessage}
                                </p>
                            </div>

                            <div className="mb-2">
                                <div className="w-full bg-gray-200 rounded-full h-1">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        className="bg-[#00A878] h-1 rounded-full transition-all"
                                    />
                                </div>
                            </div>

                            <p className="text-xs text-gray-500 text-center">
                                Closing automatically...
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

