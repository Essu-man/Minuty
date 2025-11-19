'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface PDFjsContextType {
    isReady: boolean;
    pdfjs: any;
}

const PDFjsContext = createContext<PDFjsContextType>({
    isReady: false,
    pdfjs: null,
});

export function PDFjsProvider({ children }: { children: ReactNode }) {
    const [isReady, setIsReady] = useState(false);
    const [pdfjs, setPdfjs] = useState<any>(null);

    useEffect(() => {
        // Check if already loaded
        if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
            const lib = (window as any).pdfjsLib;
            // Configure worker if not already configured
            if (lib.GlobalWorkerOptions && !lib.GlobalWorkerOptions.workerSrc) {
                // Use worker from public folder
                lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
            }
            setPdfjs(lib);
            setIsReady(true);
            return;
        }

        // Poll for PDF.js to load
        const checkInterval = setInterval(() => {
            if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
                const lib = (window as any).pdfjsLib;
                // Configure worker if not already configured
                if (lib.GlobalWorkerOptions && !lib.GlobalWorkerOptions.workerSrc) {
                    // Use worker from public folder
                    lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
                }
                setPdfjs(lib);
                setIsReady(true);
                clearInterval(checkInterval);
            }
        }, 100);

        // Timeout after 15 seconds (increased for npm package loading)
        const timeout = setTimeout(() => {
            clearInterval(checkInterval);
            if (!isReady) {
                console.error('PDF.js failed to load within 15 seconds');
            }
        }, 15000);

        return () => {
            clearInterval(checkInterval);
            clearTimeout(timeout);
        };
    }, [isReady]);

    return (
        <PDFjsContext.Provider value={{ isReady, pdfjs }}>
            {children}
        </PDFjsContext.Provider>
    );
}

export function usePDFjs() {
    return useContext(PDFjsContext);
}

