'use client';

import { Calendar, User } from 'lucide-react';

interface SignatureDisplayProps {
    title: string;
    signature: string | null | undefined;
    signerName?: string;
    signedAt?: Date | any;
}

export default function SignatureDisplay({
    title,
    signature,
    signerName,
    signedAt,
}: SignatureDisplayProps) {
    if (!signature) {
        return (
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {title}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Not signed
                </p>
            </div>
        );
    }

    const formatDate = (date: Date | any) => {
        if (!date) return null;
        try {
            const d = date.toDate ? date.toDate() : new Date(date);
            return d.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return null;
        }
    };

    return (
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {title}
            </p>
            <div className="space-y-3">
                <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-900">
                    <img
                        src={signature}
                        alt={`${title} signature`}
                        className="w-full h-auto max-h-[100px] object-contain"
                    />
                </div>
                {signerName && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <User className="w-4 h-4" />
                        <span>{signerName}</span>
                    </div>
                )}
                {signedAt && formatDate(signedAt) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(signedAt)}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

