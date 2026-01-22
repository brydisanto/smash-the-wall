'use client';

import { motion } from 'framer-motion';

interface TabToggleProps {
    activeTab: 'targets' | 'buyers';
    onTabChange: (tab: 'targets' | 'buyers') => void;
}

export default function TabToggle({ activeTab, onTabChange }: TabToggleProps) {
    return (
        <div className="flex justify-center mt-10">
            <div className="inline-flex bg-gvc-dark/80 border border-gvc-gray rounded-lg p-1">
                <button
                    onClick={() => onTabChange('targets')}
                    className={`relative px-6 py-2 rounded-lg font-mundial font-bold text-sm uppercase tracking-wider transition-colors ${activeTab === 'targets'
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
                    className={`relative px-6 py-2 rounded-lg font-mundial font-bold text-sm uppercase tracking-wider transition-colors ${activeTab === 'buyers'
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
            </div>
        </div>
    );
}
