'use client';

import { useEffect } from 'react';

export default function PDFjsLoader() {
    useEffect(() => {
        // Load PDF.js from public folder using script tag
        if (typeof window === 'undefined') return;

        // Check if already loaded
        if ((window as any).pdfjsLib) {
            console.log('PDF.js already loaded');
            return;
        }

        // Check if script is already being loaded
        if (document.getElementById('pdfjs-script')) {
            console.log('PDF.js script already in DOM');
            return;
        }

        const script = document.createElement('script');
        script.id = 'pdfjs-script';
        script.type = 'module';
        script.src = '/pdfjs-wrapper.mjs';

        script.onload = () => {
            console.log('PDF.js wrapper script loaded');
            // The wrapper will configure everything, just verify it's available
            setTimeout(() => {
                if ((window as any).pdfjsLib) {
                    console.log('PDF.js is ready');
                } else {
                    console.warn('PDF.js loaded but pdfjsLib not found on window');
                }
            }, 200);
        };

        script.onerror = (error) => {
            console.error('Failed to load PDF.js from public folder:', error);
        };

        document.head.appendChild(script);

        return () => {
            // Cleanup on unmount
            const existingScript = document.getElementById('pdfjs-script');
            if (existingScript) {
                existingScript.remove();
            }
        };
    }, []);

    return null;
}

