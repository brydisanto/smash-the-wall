'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Flame } from 'lucide-react';

interface Buyer {
    address: string;
    username: string | null;
    display: string;
    purchaseCount: number;
    totalSpentEth: number;
    vibestrBurned?: number;
}

// Helper for formatting large numbers
const formatNumber = (num: number) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return num.toLocaleString();
};

export default function Leaderboard() {
    const [buyers, setBuyers] = useState<Buyer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalSales, setTotalSales] = useState(0);

    useEffect(() => {
        const fetchBuyers = async () => {
            try {
                const res = await fetch('/api/buyers');
                const data = await res.json();
                setBuyers(data.buyers || []);
                setTotalSales(data.totalSales || 0);
            } catch (error) {
                console.error('Failed to fetch buyers:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBuyers();

        // Refresh every 60 seconds
        const interval = setInterval(fetchBuyers, 60000);
        return () => clearInterval(interval);
    }, []);

    const getRankColor = (rank: number) => {
        if (rank === 0) return 'text-yellow-400'; // Gold
        if (rank === 1) return 'text-gray-300';   // Silver
        if (rank === 2) return 'text-amber-600';  // Bronze
        return 'text-white/60';
    };

    const getRankBg = (rank: number) => {
        if (rank === 0) return 'bg-yellow-400/10 border-yellow-400/30';
        if (rank === 1) return 'bg-gray-300/10 border-gray-300/30';
        if (rank === 2) return 'bg-amber-600/10 border-amber-600/30';
        return 'bg-gvc-dark/60 border-gvc-gray';
    };

    if (isLoading) {
        return (
            <div className="w-full max-w-2xl mx-auto mt-8">
                <h2 className="text-2xl font-cooper font-bold text-white/80 uppercase tracking-wider text-center mb-6">
                    THE LEADERBOARD OF CHADS
                </h2>
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-gvc-dark/60 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (buyers.length === 0) {
        return (
            <div className="w-full max-w-2xl mx-auto mt-8 text-center">
                <h2 className="text-2xl font-cooper font-bold text-white/80 uppercase tracking-wider mb-6">
                    THE LEADERBOARD OF CHADS
                </h2>
                <p className="text-white/40 font-mundial">No sales recorded yet</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-2xl mx-auto mt-8"
        >
            <h2 className="text-2xl font-cooper font-bold text-white/80 uppercase tracking-wider text-center mb-2">
                THE LEADERBOARD OF CHADS
            </h2>
            <p className="text-center text-white/40 font-mundial text-sm mb-6">
                {totalSales} total sales from the Strategy tracked
            </p>

            <div className="space-y-3">
                {buyers.map((buyer, index) => (
                    <motion.a
                        key={buyer.address}
                        href={`https://opensea.io/${buyer.username || buyer.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * index, duration: 0.3 }}
                        className={`flex items-center gap-4 p-4 rounded-xl border ${getRankBg(index)} hover:border-gvc-gold transition-all group`}
                    >
                        {/* Rank */}
                        <div className={`text-2xl font-cooper w-8 text-center ${getRankColor(index)}`}>
                            {index + 1}
                        </div>

                        {/* Buyer Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="font-mundial font-semibold text-white truncate">
                                    {buyer.display}
                                </p>
                                <ExternalLink className="w-4 h-4 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </div>
                            {buyer.username && (
                                <p className="text-white/40 text-xs font-mono truncate">
                                    {buyer.address.substring(0, 10)}...
                                </p>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="text-right flex-shrink-0">
                            <p className="font-cooper text-gvc-gold text-lg">
                                {buyer.purchaseCount} GVCs
                            </p>
                            <p className="text-white/50 font-mundial text-sm">
                                {buyer.totalSpentEth.toFixed(1)} ETH
                            </p>
                            {buyer.vibestrBurned && (
                                <p className="text-orange-500 font-mundial text-xs mt-1 flex items-center justify-end gap-1">
                                    <Flame className="w-3 h-3" />
                                    ~{formatNumber(buyer.vibestrBurned)} BURNED
                                </p>
                            )}
                        </div>
                    </motion.a>
                ))}
            </div>
        </motion.div>
    );
}
