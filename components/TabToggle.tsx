'use client';

import { motion } from 'framer-motion';

interface TabToggleProps {
    activeTab: 'targets' | 'buyers' | 'vibewheel';
    onTabChange: (tab: 'targets' | 'buyers' | 'vibewheel') => void;
}

export default function TabToggle({ activeTab, onTabChange }: TabToggleProps) {
    return (
        <div className="flex justify-center mt-10 px-4">
            <div className="inline-flex flex-wrap justify-center gap-1 bg-gvc-dark/80 border border-gvc-gray rounded-lg p-1">
                <button
                    onClick={() => onTabChange('targets')}
                    className={`relative px-8 py-4 rounded-lg font-mundial font-bold text-sm uppercase tracking-wider transition-colors ${activeTab === 'targets'
                        ? 'text-black'
                        : 'text-white/60 hover:text-white'
                        }`}
                >
                    {activeTab === 'targets' && (
                        <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-gvc-gold rounded-lg"
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                    )}
                    <span className="relative z-10">Strategy Listings</span>
                </button>
                <button
                    onClick={() => onTabChange('buyers')}
                    className={`relative px-8 py-4 rounded-lg font-mundial font-bold text-sm uppercase tracking-wider transition-colors ${activeTab === 'buyers'
                        ? 'text-black'
                        : 'text-white/60 hover:text-white'
                        }`}
                >
                    {activeTab === 'buyers' && (
                        <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-gvc-gold rounded-lg"
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                    )}
                    <span className="relative z-10">Leaderboard</span>
                </button>
                <button
                    onClick={() => onTabChange('vibewheel')}
                    className={`relative px-8 py-4 rounded-lg font-mundial font-bold text-sm uppercase tracking-wider transition-colors ${activeTab === 'vibewheel'
                        ? 'text-black'
                        : 'text-white/60 hover:text-white'
                        }`}
                >
                    {activeTab === 'vibewheel' && (
                        <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-gvc-gold rounded-lg"
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                    )}
                    <span className="relative z-10">Rev the Vibewheel</span>
                </button>
            </div>
        </div>
    );
}
