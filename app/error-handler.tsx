'use client';

import { useEffect } from 'react';

export function ErrorHandler() {
    useEffect(() => {
        // Handle unhandled promise rejections
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            // Only log errors that aren't from external scripts
            if (event.reason && typeof event.reason === 'object') {
                const errorMessage = event.reason?.message || String(event.reason);
                // Ignore errors from browser extensions
                if (!errorMessage.includes('onboarding') && !errorMessage.includes('extension')) {
                    console.error('Unhandled promise rejection:', event.reason);
                }
            }
            // Prevent default browser error handling for known external script errors
            if (event.reason?.stack?.includes('onboarding.js')) {
                event.preventDefault();
            }
        };

        // Handle general errors
        const handleError = (event: ErrorEvent) => {
            // Ignore errors from browser extensions
            if (event.filename && (event.filename.includes('onboarding') || event.filename.includes('extension'))) {
                event.preventDefault();
                return;
            }
        };

        window.addEventListener('unhandledrejection', handleUnhandledRejection);
        window.addEventListener('error', handleError);

        return () => {
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
            window.removeEventListener('error', handleError);
        };
    }, []);

    return null;
}

