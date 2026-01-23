'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Image from 'next/image';

interface SaleToast {
    id: string;
    buyerName: string;
    nftId: string;
    priceEth: number;
    imageUrl: string | null;
}

interface ToastContextType {
    showSaleToast: (toast: Omit<SaleToast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<SaleToast[]>([]);

    const showSaleToast = useCallback((toast: Omit<SaleToast, 'id'>) => {
        const id = `${Date.now()}-${Math.random()}`;
        setToasts(prev => [...prev, { ...toast, id }]);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showSaleToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: 100, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 100, scale: 0.8 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                            className="pointer-events-auto bg-gradient-to-r from-orange-900/90 to-amber-900/90 border-2 border-gvc-gold rounded-xl p-4 shadow-2xl shadow-orange-500/20 backdrop-blur-sm min-w-[320px]"
                        >
                            <div className="flex items-start gap-3">
                                {/* NFT Image */}
                                <div className="w-14 h-14 rounded-lg overflow-hidden border-2 border-gvc-gold/50 flex-shrink-0">
                                    {toast.imageUrl ? (
                                        <Image
                                            src={toast.imageUrl}
                                            alt={`GVC #${toast.nftId}`}
                                            width={56}
                                            height={56}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gvc-gold/20 flex items-center justify-center">
                                            <span className="text-gvc-gold font-cooper text-xs">GVC</span>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <p className="font-cooper text-gvc-gold text-lg">
                                        WALL SMASHED!
                                    </p>
                                    <p className="font-mundial text-white/80 text-sm mt-1">
                                        <span className="text-white font-semibold">{toast.buyerName}</span> just bought{' '}
                                        <span className="text-gvc-gold font-semibold">GVC #{toast.nftId}</span>
                                    </p>
                                    <p className="font-mundial text-orange-400 text-sm mt-0.5">
                                        {toast.priceEth.toFixed(3)} ETH deployed 🔥
                                    </p>
                                </div>

                                {/* Close Button */}
                                <button
                                    onClick={() => removeToast(toast.id)}
                                    className="text-white/40 hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}
