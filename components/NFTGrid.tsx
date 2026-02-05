'use client';

import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

interface NFT {
    id: string;
    name: string;
    image: string;
    price: number | null;
    openseaUrl: string;
}

interface NFTGridProps {
    nfts: NFT[];
    isLoading: boolean;
}

export default function NFTGrid({ nfts, isLoading }: NFTGridProps) {
    if (isLoading) {
        return (
            <div className="w-full max-w-6xl mx-auto mt-12">
                <h2 className="text-2xl font-cooper font-bold text-white/80 mb-6 text-center uppercase tracking-wider">
                    Strategy Listings
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[...Array(10)].map((_, i) => (
                        <div
                            key={i}
                            className="aspect-square bg-gvc-dark/60 rounded-xl animate-pulse"
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (nfts.length === 0) {
        return (
            <div className="w-full max-w-6xl mx-auto mt-12 text-center">
                <h2 className="text-2xl font-cooper font-bold text-white/80 mb-6 uppercase tracking-wider">
                    Strategy Listings
                </h2>
                <p className="text-white/40 font-mundial">No NFTs currently listed at ≤1 ETH</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="w-full max-w-6xl mx-auto mt-12"
        >
            <h2 className="text-2xl font-cooper font-bold text-white/80 mb-6 text-center uppercase tracking-wider">
                Strategy Listings
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {nfts.map((nft, index) => {
                    const isRonnysPick = ['4945', '812', '785', '6185', '6245', '6634', '3661', '2033', '3833', '1589', '2377', '371', '4446', '936', '1348', '1667', '5583', '2769', '3600', '4161', '151', '1242', '6302', '3919', '1114', '1059', '4547', '4576', '6049'].includes(nft.id);
                    return (
                        <motion.a
                            key={nft.id}
                            href={nft.openseaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * Math.min(index, 10), duration: 0.3 }}
                            className={`group relative bg-gvc-dark/80 rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 ${isRonnysPick
                                ? 'border-2 border-gvc-gold shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:shadow-[0_0_25px_rgba(234,179,8,0.5)]'
                                : 'border border-gvc-gray hover:border-gvc-gold'
                                }`}
                        >
                            {/* Ronny's Pick Badge */}
                            {isRonnysPick && (
                                <div className="absolute top-0 right-0 z-20">
                                    <div className="bg-gvc-gold text-black font-mundial font-bold text-[10px] uppercase tracking-wider px-2 py-1 rounded-bl-lg shadow-lg">
                                        Ronny's Pick
                                    </div>
                                </div>
                            )}

                            {/* NFT Image */}
                            <div className="aspect-square relative bg-gradient-to-br from-gvc-gold/20 to-orange-900/20">
                                <img
                                    src={nft.image}
                                    alt={nft.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={(e) => {
                                        // Replace broken image with placeholder
                                        const target = e.currentTarget;
                                        target.style.display = 'none';
                                        target.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                                        const placeholder = document.createElement('span');
                                        placeholder.className = 'text-gvc-gold/50 font-cooper text-2xl';
                                        placeholder.textContent = 'GVC';
                                        target.parentElement?.appendChild(placeholder);
                                    }}
                                />
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <ExternalLink className="w-8 h-8 text-gvc-gold" />
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-3">
                                <p className="text-white/90 font-mundial font-medium text-xs sm:text-sm truncate">{nft.name}</p>
                                <p className="text-gvc-gold font-mundial font-bold text-base sm:text-lg mt-1">
                                    {nft.price !== null ? `${nft.price.toFixed(3)} ETH` : '—'}
                                </p>
                            </div>
                        </motion.a>
                    );
                })}
            </div>
        </motion.div>
    );
}
