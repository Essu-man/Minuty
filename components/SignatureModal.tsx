'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Type, Settings } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

interface SignatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (imageData: string) => void;
}

interface CursiveFont {
    name: string;
    family: string;
    googleFont: string;
    weight?: string;
}

const cursiveFonts: CursiveFont[] = [
    { name: 'Dancing Script', family: '"Dancing Script", cursive', googleFont: 'Dancing+Script:wght@400;500;600;700' },
    { name: 'Great Vibes', family: '"Great Vibes", cursive', googleFont: 'Great+Vibes' },
    { name: 'Allura', family: '"Allura", cursive', googleFont: 'Allura' },
    { name: 'Brush Script', family: '"Brush Script MT", cursive', googleFont: 'Brush+Script+MT' },
    { name: 'Pacifico', family: '"Pacifico", cursive', googleFont: 'Pacifico' },
    { name: 'Satisfy', family: '"Satisfy", cursive', googleFont: 'Satisfy' },
    { name: 'Kalam', family: '"Kalam", cursive', googleFont: 'Kalam:wght@300;400;700' },
    { name: 'Caveat', family: '"Caveat", cursive', googleFont: 'Caveat:wght@400;500;600;700' },
];

export default function SignatureModal({ isOpen, onClose, onSave }: SignatureModalProps) {
    const [mode, setMode] = useState<'draw' | 'type'>('type');
    const [fullName, setFullName] = useState('');
    const [consentChecked, setConsentChecked] = useState(false);
    const [selectedFont, setSelectedFont] = useState<CursiveFont>(cursiveFonts[0]);
    const [fontSize, setFontSize] = useState(64);
    const [fontWeight, setFontWeight] = useState(400);
    const sigCanvasRef = useRef<SignatureCanvas>(null);

    useEffect(() => {
        if (!isOpen) {
            setFullName('');
            setConsentChecked(false);
            if (sigCanvasRef.current) {
                sigCanvasRef.current.clear();
            }
        }
    }, [isOpen]);

    // Load Google Fonts dynamically
    useEffect(() => {
        const fontLinks = cursiveFonts.map(font => {
            const linkId = `font-${font.name.replace(/\s+/g, '-').toLowerCase()}`;
            if (document.getElementById(linkId)) {
                return null; // Font already loaded
            }
            const link = document.createElement('link');
            link.id = linkId;
            link.rel = 'stylesheet';
            link.href = `https://fonts.googleapis.com/css2?family=${font.googleFont}&display=swap`;
            return link;
        }).filter(Boolean);

        fontLinks.forEach(link => {
            if (link) document.head.appendChild(link);
        });

        return () => {
            // Cleanup on unmount (optional - fonts can stay loaded)
        };
    }, []);

    const handleSave = () => {
        if (!consentChecked) {
            return;
        }

        if (mode === 'draw' && sigCanvasRef.current) {
            const imageData = sigCanvasRef.current.toDataURL();
            onSave(imageData);
        } else if (mode === 'type' && fullName.trim()) {
            // Create a canvas with typed signature
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 600;
            canvas.height = 200;

            if (ctx) {
                // Use selected font and styling
                ctx.font = `${fontWeight} ${fontSize}px ${selectedFont.family}`;
                ctx.fillStyle = '#000000';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(fullName, canvas.width / 2, canvas.height / 2);
            }

            const imageData = canvas.toDataURL();
            onSave(imageData);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-lg sm:rounded-2xl shadow-2xl w-full max-w-2xl my-auto">
                <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                    <h2 className="text-lg sm:text-2xl font-semibold text-gray-900">Adopt Your Signature</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-4 sm:p-6">
                    <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                        Select an option below to create your electronic signature.
                    </p>

                    <div className="flex gap-2 mb-4 sm:mb-6">
                        <button
                            onClick={() => setMode('type')}
                            className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg text-sm sm:text-base font-semibold transition-colors ${mode === 'type'
                                ? 'bg-[#00A878] text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Type
                        </button>
                        <button
                            onClick={() => setMode('draw')}
                            className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg text-sm sm:text-base font-semibold transition-colors ${mode === 'draw'
                                ? 'bg-[#00A878] text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Draw
                        </button>
                    </div>

                    {mode === 'type' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="John Appleseed"
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A878] focus:border-[#00A878] bg-white text-gray-900"
                            />

                            {/* Signature Style Options - Directly under Full Name */}
                            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3 sm:space-y-4">
                                {/* Font Selection */}
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                        Cursive Font Style
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-1.5 sm:gap-2">
                                        {cursiveFonts.map((font) => (
                                            <button
                                                key={font.name}
                                                onClick={() => setSelectedFont(font)}
                                                className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border-2 text-xs sm:text-sm transition-all ${selectedFont.name === font.name
                                                    ? 'border-[#00A878] bg-[#00A878]/10 font-semibold text-black'
                                                    : 'border-gray-300 hover:border-gray-400 text-black bg-white'
                                                    }`}
                                                style={{ fontFamily: font.family, color: '#000000' }}
                                            >
                                                {font.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Font Size */}
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                        Font Size: {fontSize}px
                                    </label>
                                    <input
                                        type="range"
                                        min="40"
                                        max="100"
                                        value={fontSize}
                                        onChange={(e) => setFontSize(Number(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#00A878]"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>Small</span>
                                        <span>Large</span>
                                    </div>
                                </div>

                                {/* Font Weight */}
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                        Font Weight
                                    </label>
                                    <div className="grid grid-cols-3 sm:flex sm:gap-2 gap-1.5 sm:gap-2">
                                        {[300, 400, 500, 600, 700].map((weight) => (
                                            <button
                                                key={weight}
                                                onClick={() => setFontWeight(weight)}
                                                className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border-2 text-xs sm:text-sm transition-all ${fontWeight === weight
                                                    ? 'border-[#00A878] bg-[#00A878]/10 font-semibold text-black'
                                                    : 'border-gray-300 hover:border-gray-400 text-black bg-white'
                                                    }`}
                                                style={{
                                                    fontFamily: selectedFont.family,
                                                    fontWeight: weight,
                                                    color: '#000000',
                                                }}
                                            >
                                                {weight === 300 ? 'Light' :
                                                    weight === 400 ? 'Regular' :
                                                        weight === 500 ? 'Medium' :
                                                            weight === 600 ? 'Semi-Bold' : 'Bold'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 sm:mt-4 p-4 sm:p-6 bg-gray-50 rounded-lg border-2 border-gray-200 min-h-[100px] sm:min-h-[120px] flex items-center justify-center">
                                {fullName ? (
                                    <p
                                        className="text-gray-900 break-words text-center px-2"
                                        style={{
                                            fontFamily: selectedFont.family,
                                            fontSize: `clamp(${Math.max(24, fontSize * 0.5)}px, ${fontSize * 0.8}px, ${fontSize}px)`,
                                            fontWeight: fontWeight,
                                            fontStyle: 'normal',
                                        }}
                                    >
                                        {fullName}
                                    </p>
                                ) : (
                                    <p className="text-xs sm:text-sm text-gray-400 text-center px-2">Your signature preview will appear here</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="border-2 border-gray-300 rounded-lg bg-white overflow-hidden">
                            <SignatureCanvas
                                ref={sigCanvasRef}
                                canvasProps={{
                                    className: 'w-full h-48 sm:h-64 touch-none',
                                }}
                                backgroundColor="white"
                            />
                        </div>
                    )}

                    <div className="mt-4 sm:mt-6 flex items-start gap-2 sm:gap-3">
                        <input
                            type="checkbox"
                            id="consent"
                            checked={consentChecked}
                            onChange={(e) => setConsentChecked(e.target.checked)}
                            className="mt-0.5 sm:mt-1 w-4 h-4 sm:w-5 sm:h-5 text-[#00A878] border-gray-300 rounded focus:ring-[#00A878] flex-shrink-0"
                        />
                        <label htmlFor="consent" className="text-xs sm:text-sm text-gray-700 cursor-pointer leading-relaxed">
                            I agree that this is a valid electronic representation of my signature.
                        </label>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-4 sm:mt-8">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!consentChecked || (mode === 'type' && !fullName.trim()) || (mode === 'draw' && !sigCanvasRef.current)}
                            className="flex-1 bg-[#00A878] hover:bg-[#008f65] text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 text-sm sm:text-base rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Adopt and Sign
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
