'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Target, ArrowUp, ArrowDown } from 'lucide-react';

interface BurnStats {
    burned: number;
    totalSupply: number;
    burnPercentage: number;
}



interface NFT {
    price: number | null;
}

interface StatsProps {
    nftCount: number;
    isLoadingNfts: boolean;
    nfts: NFT[];
}

export default function StatsPanel({ nftCount, isLoadingNfts, nfts }: StatsProps) {
    const [burnStats, setBurnStats] = useState<BurnStats | null>(null);
    const [isLoadingBurn, setIsLoadingBurn] = useState(true);
    const [totalEth, setTotalEth] = useState(0);
    const [changes24h, setChanges24h] = useState<{ gvcsSold24h: number; vibestrBurned24h: number } | null>(null);
    const [collectionStats, setCollectionStats] = useState<{ totalListings: number; floorPrice: number } | null>(null);
    const [prevCollectionStats, setPrevCollectionStats] = useState<{ totalListings: number; floorPrice: number } | null>(null);

    useEffect(() => {
        const fetchBurnStats = async () => {
            try {
                const res = await fetch(`/api/burn?t=${Date.now()}`, { cache: 'no-store' });
                const data = await res.json();
                setBurnStats(data);
            } catch (error) {
                console.error('Failed to fetch burn stats:', error);
            } finally {
                setIsLoadingBurn(false);
            }
        };

        fetchBurnStats();

        // Refresh every 60 seconds
        const interval = setInterval(fetchBurnStats, 60000);
        return () => clearInterval(interval);
    }, []);

    // Fetch 24hr changes
    useEffect(() => {
        const fetchChanges = async () => {
            try {
                const res = await fetch('/api/changes');
                const data = await res.json();
                setChanges24h(data);
            } catch (error) {
                console.error('Failed to fetch 24h changes:', error);
            }
        };

        fetchChanges();

        // Refresh every 60 seconds
        const interval = setInterval(fetchChanges, 60000);
        return () => clearInterval(interval);
    }, []);

    // Fetch collection stats (total listings, floor price)
    useEffect(() => {
        const fetchCollectionStats = async () => {
            try {
                const res = await fetch('/api/collection');
                const data = await res.json();
                // Store previous for 24hr change comparison (simplified - just tracks session change)
                if (collectionStats) {
                    setPrevCollectionStats(collectionStats);
                }
                setCollectionStats(data);
            } catch (error) {
                console.error('Failed to fetch collection stats:', error);
            }
        };

        fetchCollectionStats();

        // Refresh every 60 seconds
        const interval = setInterval(fetchCollectionStats, 60000);
        return () => clearInterval(interval);
    }, []);

    // Calculate total ETH when NFTs are loaded
    useEffect(() => {
        if (nfts.length === 0) return;
        const ethTotal = nfts.reduce((sum, nft) => sum + (nft.price || 0), 0);
        setTotalEth(ethTotal);
    }, [nfts]);

    const formatNumber = (num: number) => {
        if (num >= 1_000_000_000) {
            return (num / 1_000_000_000).toFixed(1) + 'B';
        }
        if (num >= 1_000_000) {
            return (num / 1_000_000).toFixed(1) + 'M';
        }
        if (num >= 1_000) {
            return (num / 1_000).toFixed(1) + 'K';
        }
        return num.toLocaleString();
    };



    return (
        <div className="w-full max-w-5xl mx-auto">
            {/* Main Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mt-8"
            >
                {/* Total GVCs */}
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.7, duration: 0.4, type: "spring", stiffness: 100 }}
                    className="bg-gvc-dark/80 border border-gvc-gray rounded-2xl p-4 md:p-6 backdrop-blur-sm relative overflow-hidden"
                >
                    {/* Noise texture overlay */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-2xl" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-white/60" />
                        <span className="text-white/60 font-mundial text-xs uppercase tracking-wider">Total GVCs</span>
                    </div>
                    <div className="text-2xl md:text-3xl font-cooper text-white">
                        {collectionStats ? collectionStats.totalListings : <span className="animate-pulse">...</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-white/40 text-xs font-mundial">Listed ≤1 ETH</p>
                        {prevCollectionStats && collectionStats && prevCollectionStats.totalListings !== collectionStats.totalListings && (
                            <span className={`flex items-center gap-0.5 text-xs font-mundial font-semibold ${collectionStats.totalListings < prevCollectionStats.totalListings ? 'text-green-500' : 'text-red-500'}`}>
                                {collectionStats.totalListings < prevCollectionStats.totalListings ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                                {Math.abs(collectionStats.totalListings - prevCollectionStats.totalListings)} (24h)
                            </span>
                        )}
                    </div>
                </motion.div>

                {/* Floor Price */}
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.8, duration: 0.4, type: "spring", stiffness: 100 }}
                    className="bg-gvc-dark/80 border border-gvc-gray rounded-2xl p-4 md:p-6 backdrop-blur-sm relative overflow-hidden"
                >
                    {/* Noise texture overlay */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-2xl" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-white/60" />
                        <span className="text-white/60 font-mundial text-xs uppercase tracking-wider">Floor Price</span>
                    </div>
                    <div className="text-2xl md:text-3xl font-cooper text-white">
                        {collectionStats ? `${collectionStats.floorPrice.toFixed(3)}` : <span className="animate-pulse">...</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-white/40 text-xs font-mundial">ETH</p>
                        {prevCollectionStats && collectionStats && prevCollectionStats.floorPrice !== collectionStats.floorPrice && (
                            <span className={`flex items-center gap-0.5 text-xs font-mundial font-semibold ${collectionStats.floorPrice > prevCollectionStats.floorPrice ? 'text-green-500' : 'text-red-500'}`}>
                                {collectionStats.floorPrice > prevCollectionStats.floorPrice ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                {Math.abs(collectionStats.floorPrice - prevCollectionStats.floorPrice).toFixed(3)} (24h)
                            </span>
                        )}
                    </div>
                </motion.div>

                {/* Strategy GVCs */}
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.9, duration: 0.4, type: "spring", stiffness: 100 }}
                    className="bg-gvc-dark/80 border border-gvc-gold/50 rounded-2xl p-4 md:p-6 backdrop-blur-sm relative overflow-hidden"
                >
                    {/* Noise texture overlay */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-2xl" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-gvc-gold" />
                        <span className="text-white/60 font-mundial text-xs uppercase tracking-wider">Strategy GVCs</span>
                    </div>
                    <div className="text-2xl md:text-3xl font-cooper text-gvc-gold">
                        {isLoadingNfts ? (
                            <span className="animate-pulse">...</span>
                        ) : (
                            nftCount
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-white/40 text-xs font-mundial">Listed ≤1 ETH</p>
                        {changes24h && changes24h.gvcsSold24h > 0 && (
                            <span className="flex items-center gap-0.5 text-green-500 text-xs font-mundial font-semibold">
                                <ArrowDown className="w-3 h-3" />
                                {changes24h.gvcsSold24h} (24h)
                            </span>
                        )}
                    </div>
                </motion.div>

                {/* Burn Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 1.0, duration: 0.4, type: "spring", stiffness: 100 }}
                    className="bg-gvc-dark/80 border border-orange-500/50 rounded-2xl p-4 md:p-6 backdrop-blur-sm relative overflow-hidden"
                >
                    {/* Noise texture overlay */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-2xl" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />
                    <div className="flex items-center gap-2 mb-2">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="text-white/60 font-mundial text-xs uppercase tracking-wider">$VIBESTR Burned</span>
                    </div>
                    <div className="text-2xl md:text-3xl font-cooper text-orange-500 tracking-wide">
                        {isLoadingBurn ? (
                            <span className="animate-pulse">...</span>
                        ) : burnStats ? (
                            <>{formatNumber(burnStats.burned)}</>
                        ) : (
                            '—'
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-white/40 text-xs font-mundial">
                            {isLoadingBurn ? (
                                '...'
                            ) : burnStats ? (
                                <>{burnStats.burnPercentage.toFixed(2)}%</>
                            ) : (
                                '—'
                            )}
                        </p>
                        {changes24h && changes24h.vibestrBurned24h > 0 && (
                            <span className="flex items-center gap-0.5 text-green-500 text-xs font-mundial font-semibold">
                                <ArrowUp className="w-3 h-3" />
                                {formatNumber(changes24h.vibestrBurned24h)} (24h)
                            </span>
                        )}
                    </div>
                </motion.div>
            </motion.div>

            {/* Progress Bar - Animated Gradient Shimmer */}
            <motion.div
                initial={{ opacity: 0, scaleX: 0.95 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="w-full mt-8 mb-4 px-4 md:px-12"
            >
                <div
                    className="h-20 rounded-2xl overflow-hidden relative"
                    style={{
                        background: 'linear-gradient(90deg, rgba(234,179,8,0.1), rgba(234,179,8,0.2))',
                        border: '2px solid rgba(234,179,8,0.4)'
                    }}
                >
                    {/* Progress Fill with Shimmer */}
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: isLoadingNfts ? "0%" : `${Math.min(100, Math.max(0, ((650 - nfts.length) / 650) * 100))}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="absolute left-0 top-0 h-full rounded-l-xl animate-shimmer"
                        style={{
                            background: 'linear-gradient(90deg, #b45309, #eab308, #fbbf24)',
                            backgroundSize: '200% 100%'
                        }}
                    >
                        {/* Glow Pulse Effect */}
                        <div className="absolute right-0 top-0 h-full w-10 animate-glowPulse"
                            style={{
                                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)'
                            }}
                        />
                    </motion.div>

                    {/* Label - Centered & On Top */}
                    <span className="absolute inset-0 flex items-center justify-center z-20 text-white font-cooper text-sm sm:text-lg md:text-2xl tracking-wide drop-shadow-[0_0_20px_rgba(234,179,8,0.8)]">
                        {isLoadingNfts ? (
                            <span className="animate-pulse">Loading...</span>
                        ) : (
                            `${Math.round(((650 - nfts.length) / 650) * 100)}% OF THE WAY TO VIBEHALLA`
                        )}
                    </span>
                </div>
            </motion.div>


        </div>
    );
}
