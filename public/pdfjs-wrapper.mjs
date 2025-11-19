// Wrapper to expose PDF.js from ES module to window
import * as pdfjsModule from './pdf.min.mjs';

// Expose to window for compatibility
if (typeof window !== 'undefined') {
    // PDF.js ES module exports the library as default or as named exports
    const pdfjsLib = pdfjsModule.default || pdfjsModule;
    window.pdfjsLib = pdfjsLib;
    
    // Configure worker
    if (pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    } else {
        pdfjsLib.GlobalWorkerOptions = {
            workerSrc: '/pdf.worker.min.mjs',
        };
    }
    
    console.log('PDF.js loaded and exposed to window.pdfjsLib');
}

