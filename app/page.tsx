'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import StatsPanel from '@/components/StatsPanel';
import NFTGrid from '@/components/NFTGrid';
import TabToggle from '@/components/TabToggle';
import Leaderboard from '@/components/Leaderboard';
import FlameBackground from '@/components/FlameBackground';
import { ToastProvider } from '@/components/ToastProvider';
import SalesWatcher from '@/components/SalesWatcher';

interface NFT {
    id: string;
    name: string;
    image: string;
    price: number | null;
    openseaUrl: string;
}

export default function Home() {
    const [nfts, setNfts] = useState<NFT[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'targets' | 'buyers'>('targets');

    useEffect(() => {
        const fetchNfts = async () => {
            try {
                const res = await fetch('/api/nfts');
                const data = await res.json();
                setNfts(data.nfts || []);
            } catch (error) {
                console.error('Failed to fetch NFTs:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNfts();

        // Refresh every 60 seconds
        const interval = setInterval(fetchNfts, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <ToastProvider>
            <SalesWatcher />
            <main className="flex min-h-screen flex-col items-center p-4 pt-8 md:p-12 md:pt-16 bg-[url('/grid.svg')] bg-center relative">
                <FlameBackground />
                {/* Header */}
                <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm lg:flex">
                    <div className="flex flex-col items-center">
                        <motion.p
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.5 }}
                            className="text-gvc-gold/80 font-mundial font-bold tracking-[0.2em] text-xs md:text-sm mb-4 uppercase"
                        >
                            THE MARCH TO 1ETH
                        </motion.p>
                        <motion.h1
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{
                                type: "spring",
                                stiffness: 100,
                                damping: 10,
                                mass: 1,
                                delay: 0.2
                            }}
                            className="text-5xl md:text-7xl lg:text-8xl font-cooper text-center text-gvc-gold glowing-text leading-none"
                        >
                            SMASH THE WALL!
                        </motion.h1>
                    </div>
                </div>

                {/* Rallying Cry */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="z-10 max-w-3xl text-center text-white/70 font-mundial text-base md:text-lg mt-6 leading-relaxed flex flex-col gap-3"
                >
                    <span>There's a movement happening in Vibetown.</span>
                    <span>A thick wall of GVCs was left behind by the $VIBESTR launch. Your mission is to help smash the wall, as one community, and take down all Strategy-listed GVCs at or below 1ETH.</span>
                    <span>This unlocks the next phase of GVC's growth.</span>
                    <span>More to come on that soon...</span>
                </motion.div>

                {/* Stats Panel */}
                <StatsPanel nftCount={nfts.length} isLoadingNfts={isLoading} nfts={nfts} />

                {/* Tab Toggle */}
                <TabToggle activeTab={activeTab} onTabChange={setActiveTab} />

                {/* Content Area */}
                <AnimatePresence mode="wait">
                    {activeTab === 'targets' ? (
                        <motion.div
                            key="targets"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="w-full"
                        >
                            <NFTGrid nfts={nfts} isLoading={isLoading} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="buyers"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="w-full"
                        >
                            <Leaderboard />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer spacing */}
                <div className="h-16" />
            </main>
        </ToastProvider>
    );
}
