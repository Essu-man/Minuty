// Type declarations for PDF.js loaded from CDN
declare global {
    interface Window {
        pdfjsLib: {
            getDocument: (options: { url: string }) => {
                promise: Promise<{
                    numPages: number;
                    getPage: (pageNumber: number) => Promise<{
                        getViewport: (options: { scale: number }) => {
                            width: number;
                            height: number;
                        };
                        render: (options: {
                            canvasContext: CanvasRenderingContext2D;
                            viewport: { width: number; height: number };
                        }) => {
                            promise: Promise<void>;
                        };
                    }>;
                }>;
            };
            GlobalWorkerOptions: {
                workerSrc: string;
            };
            version: string;
        };
    }
}

export {};

