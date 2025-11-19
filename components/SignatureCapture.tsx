'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';

export interface SignatureCaptureProps {
    title: string;
    placeholder: string;
    value: string | null;
    onSignatureChange: (signature: string | null) => void;
    required?: boolean;
}

export default function SignatureCapture({
    title,
    placeholder,
    value,
    onSignatureChange,
    required = false,
}: SignatureCaptureProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    // Initialize canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        // Set drawing styles
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Load existing signature if value exists
        if (value) {
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
                ctx.drawImage(img, 0, 0, rect.width, rect.height);
                setHasSignature(true);
            };
            img.src = value;
        } else {
            ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
            setHasSignature(false);
        }
    }, [value]);

    // Get coordinates from event (mouse or touch)
    const getCoordinates = useCallback((e: MouseEvent | TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        if (e instanceof MouseEvent) {
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
        } else {
            const touch = e.touches[0] || e.changedTouches[0];
            return {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top,
            };
        }
    }, []);

    // Start drawing
    const startDrawing = useCallback((e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const coords = getCoordinates(e);
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
        setIsDrawing(true);
        setHasSignature(false);
    }, [getCoordinates]);

    // Draw
    const draw = useCallback((e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const coords = getCoordinates(e);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
    }, [isDrawing, getCoordinates]);

    // Stop drawing
    const stopDrawing = useCallback(() => {
        if (!isDrawing) return;

        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Get signature data
        const signatureData = canvas.toDataURL('image/png');
        const ctx = canvas.getContext('2d');
        if (ctx && signatureData) {
            // Check if canvas has content (not just white/transparent)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            let hasContent = false;
            
            // Check for any non-white, non-transparent pixels
            for (let i = 0; i < imageData.data.length; i += 4) {
                const r = imageData.data[i];
                const g = imageData.data[i + 1];
                const b = imageData.data[i + 2];
                const a = imageData.data[i + 3];
                
                // If pixel is not white and has some opacity, we have content
                if (a > 0 && (r < 250 || g < 250 || b < 250)) {
                    hasContent = true;
                    break;
                }
            }

            if (hasContent) {
                setHasSignature(true);
                onSignatureChange(signatureData);
            }
        }
    }, [isDrawing, onSignatureChange]);

    // Clear signature
    const clearSignature = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        setHasSignature(false);
        onSignatureChange(null);
    }, [onSignatureChange]);

    // Mouse event handlers
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleMouseDown = (e: MouseEvent) => startDrawing(e);
        const handleMouseMove = (e: MouseEvent) => draw(e);
        const handleMouseUp = () => stopDrawing();
        const handleMouseLeave = () => stopDrawing();

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [startDrawing, draw, stopDrawing]);

    // Touch event handlers
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleTouchStart = (e: TouchEvent) => startDrawing(e);
        const handleTouchMove = (e: TouchEvent) => draw(e);
        const handleTouchEnd = () => stopDrawing();

        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd);

        return () => {
            canvas.removeEventListener('touchstart', handleTouchStart);
            canvas.removeEventListener('touchmove', handleTouchMove);
            canvas.removeEventListener('touchend', handleTouchEnd);
        };
    }, [startDrawing, draw, stopDrawing]);

    return (
        <div className="w-full">
            <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {title}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {!value && !hasSignature && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{placeholder}</p>
                )}
            </div>

            <div className="relative border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 overflow-hidden">
                {value && !isDrawing ? (
                    // Display mode - show existing signature
                    <div className="relative p-4">
                        <img
                            src={value}
                            alt={title}
                            className="w-full h-auto max-h-[150px] object-contain mx-auto"
                        />
                        <button
                            onClick={clearSignature}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                            aria-label="Clear signature"
                            title="Clear signature"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    // Drawing mode
                    <div className="relative">
                        <canvas
                            ref={canvasRef}
                            className="w-full h-[150px] cursor-crosshair touch-none"
                            style={{ minHeight: '150px' }}
                            aria-label={`${title} signature canvas`}
                        />
                        {hasSignature && (
                            <div className="absolute top-2 right-2">
                                <button
                                    onClick={clearSignature}
                                    className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                                    aria-label="Clear signature"
                                    title="Clear signature"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {!value && (
                <button
                    onClick={clearSignature}
                    className="mt-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
                    disabled={!hasSignature}
                >
                    Clear
                </button>
            )}

            {required && !value && !hasSignature && (
                <p className="mt-1 text-xs text-red-500">This signature is required</p>
            )}
        </div>
    );
}

