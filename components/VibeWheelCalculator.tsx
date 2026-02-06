'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, ChevronsDown } from 'lucide-react';

interface StrategyData {
    count: number;
    listings: number[];
    floorPrice: number;
}

interface PriceData {
    ethUsd: number;
    vibestrUsd: number;
}

const TOTAL_SUPPLY = 1_000_000_000; // 1 Billion

const formatNumber = (num: number) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return num.toLocaleString();
};

export default function VibeWheelCalculator() {
    const [sweepAmount, setSweepAmount] = useState<number>(10);
    const [strategyData, setStrategyData] = useState<StrategyData | null>(null);
    const [prices, setPrices] = useState<PriceData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [strategyRes, pricesRes] = await Promise.all([
                    fetch('/api/strategy-holdings'),
                    fetch('/api/prices')
                ]);

                const sData = await strategyRes.json();
                const pData = await pricesRes.json();

                setStrategyData({
                    count: sData.count || 0,
                    listings: sData.listings || [],
                    floorPrice: sData.floorPrice || 0
                });
                setPrices(pData);
            } catch (error) {
                console.error('Error fetching VibeWheel data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Calculation Logic
    const [calculatedResults, setCalculatedResults] = useState({
        ethGenerated: 0,
        vibestrBurned: 0,
        supplyPercent: 0,
        currentPrice: 0,
        projectedPrice: 0,
        priceIncrease: 0
    });
    const [isExploding, setIsExploding] = useState(false);

    const handleCalculate = () => {
        if (!prices || sweepAmount <= 0) return;

        // Trigger explosion animation
        setIsExploding(true);
        setTimeout(() => setIsExploding(false), 600);

        let totalEth = 0;
        const listings = strategyData?.listings || [];

        // Use REAL listings if available
        if (listings.length > 0) {
            // Sort just in case, though API should yield sorted
            const sortedListings = [...listings].sort((a, b) => a - b);

            // Sum the cheapest 'n' listings
            // If sweepAmount > active listings, we can either cap it or assume remaining are at the last price (or floor)
            // Let's assume remaining are at last known listing price to be conservative/realistic
            for (let i = 0; i < sweepAmount; i++) {
                if (i < sortedListings.length) {
                    totalEth += sortedListings[i];
                } else {
                    // Out of active listings, assume last known price
                    totalEth += sortedListings[sortedListings.length - 1] || 0.94;
                }
            }
        } else {
            // Fallback: "Dense Wall" Simulation (User requested manual calc if API fails/empty)
            // Slope: 0.0004 ETH per item
            const effectiveFloor = strategyData?.floorPrice || 0.94;

            for (let i = 0; i < sweepAmount; i++) {
                const slippage = 1 + (i * 0.0004);
                const price = effectiveFloor * slippage;
                totalEth += price;
            }
        }

        const vibestrBurned = (totalEth * prices.ethUsd) / (prices.vibestrUsd || 0.01);
        const supplyPercent = (vibestrBurned / TOTAL_SUPPLY) * 100;

        // Price impact calculation using Uniswap constant product AMM formula
        // Pool reserves (from DexScreener):
        const POOL_ETH = 267.96;
        const POOL_VIBESTR = 85_079_842;
        const k = POOL_ETH * POOL_VIBESTR; // constant product

        // After adding ETH to buy VIBESTR:
        // new_eth_reserve = old_eth + eth_added
        // new_vibestr_reserve = k / new_eth_reserve
        // new_price = new_eth_reserve / new_vibestr_reserve (in ETH terms)
        const newEthReserve = POOL_ETH + totalEth;
        const newVibestrReserve = k / newEthReserve;

        // Price in ETH per VIBESTR (for calculating % increase)
        const oldPriceEth = POOL_ETH / POOL_VIBESTR;
        const newPriceEth = newEthReserve / newVibestrReserve;
        const priceIncrease = ((newPriceEth - oldPriceEth) / oldPriceEth) * 100;

        // Use actual API price for display, apply % increase for projected
        const currentPrice = prices.vibestrUsd || 0.01;
        const projectedPrice = currentPrice * (1 + priceIncrease / 100);

        setCalculatedResults({
            ethGenerated: totalEth,
            vibestrBurned,
            supplyPercent,
            currentPrice,
            projectedPrice,
            priceIncrease
        });
    };

    return (
        <div className="w-full max-w-4xl mx-auto mt-6 mb-20 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/40 backdrop-blur-md rounded-3xl p-8 md:p-12 text-center relative overflow-hidden"
            >
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-orange-500/10 blur-[100px] pointer-events-none" />

                <h2 className="text-2xl md:text-3xl font-cooper text-white uppercase mb-8 relative z-10 flex flex-col items-center gap-2">
                    <span>STRATEGY HOLDINGS (≤1 ETH):</span>
                    <span className="text-gvc-gold text-xl md:text-2xl display-block mt-2 whitespace-nowrap">
                        {isLoading ? '...' : (strategyData?.count ?? 0)} GVCs
                        <span className="text-white/40 mx-2 md:mx-3">|</span>
                        <span className="text-white/60">{isLoading ? '...' : (strategyData?.floorPrice?.toFixed(3) ?? '0.000')} ETH Lowest</span>
                    </span>
                </h2>


                <div className="max-w-xl mx-auto space-y-8 relative z-10">

                    {/* Input Section */}
                    <div className="space-y-4">
                        <label htmlFor="sweep-amount" className="block text-gvc-gold font-mundial font-bold tracking-widest text-sm uppercase">
                            VibeStrategy GVCs to Sweep
                        </label>
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex items-center gap-3">
                                {/* Minus Button */}
                                <button
                                    onClick={() => setSweepAmount(Math.max(0, sweepAmount - 5))}
                                    aria-label="Decrease sweep amount by 5"
                                    className="w-12 h-12 rounded-lg bg-white/10 border border-white/20 text-white/60 hover:bg-white/20 hover:text-white hover:border-gvc-gold/50 transition-all flex items-center justify-center text-2xl font-bold active:scale-95"
                                >
                                    −
                                </button>
                                <input
                                    id="sweep-amount"
                                    type="number"
                                    min="1"
                                    max="185"
                                    value={sweepAmount}
                                    onChange={(e) => {
                                        let val = parseInt(e.target.value);
                                        if (isNaN(val)) val = 0;
                                        if (val > 185) val = 185;
                                        if (val < 0) val = 0;
                                        setSweepAmount(val);
                                    }}
                                    className="w-28 bg-white/5 border-2 border-white/20 rounded-xl py-3 text-center text-3xl font-cooper text-white focus:outline-none focus:border-gvc-gold transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                {/* Plus Button */}
                                <button
                                    onClick={() => setSweepAmount(Math.min(185, sweepAmount + 5))}
                                    aria-label="Increase sweep amount by 5"
                                    className="w-12 h-12 rounded-lg bg-white/10 border border-white/20 text-white/60 hover:bg-white/20 hover:text-white hover:border-gvc-gold/50 transition-all flex items-center justify-center text-2xl font-bold active:scale-95"
                                >
                                    +
                                </button>
                            </div>

                            <div className="relative">
                                {/* Explosion particles */}
                                {isExploding && (
                                    <>
                                        {[...Array(12)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                className="absolute w-2 h-2 rounded-full bg-gvc-gold"
                                                initial={{
                                                    x: 0,
                                                    y: 0,
                                                    opacity: 1,
                                                    scale: 1,
                                                    left: '50%',
                                                    top: '50%'
                                                }}
                                                animate={{
                                                    x: Math.cos(i * 30 * Math.PI / 180) * 80,
                                                    y: Math.sin(i * 30 * Math.PI / 180) * 80,
                                                    opacity: 0,
                                                    scale: 0
                                                }}
                                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                            />
                                        ))}
                                    </>
                                )}
                                <button
                                    onClick={handleCalculate}
                                    className="relative overflow-hidden bg-gvc-gold text-black font-cooper font-bold uppercase tracking-wider py-4 px-10 rounded-lg hover:bg-white transition-all shadow-[0_0_20px_rgba(255,224,72,0.4)] active:scale-95 transform duration-200"
                                >
                                    {/* Shimmer overlay */}
                                    <div className="absolute inset-0 overflow-hidden">
                                        <div className="absolute w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 animate-shimmer" />
                                    </div>
                                    {/* Sparkle dots */}
                                    <div className="absolute w-2 h-2 top-2 right-4 bg-white/60 rounded-full blur-[1px] animate-ping" style={{ animationDuration: '2s' }} />
                                    <div className="absolute w-1.5 h-1.5 bottom-2 left-6 bg-white/50 rounded-full blur-[1px] animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
                                    <span className="relative z-10 text-lg">SIMULATE SWEEP!</span>
                                </button>
                            </div>
                        </div>
                        <p className="text-white/40 text-xs italic">
                            (Calculated using live listings from the VibeStrategy wallet)
                        </p>
                    </div>

                    {/* Results Connector */}
                    <div className="flex justify-center">
                        <ChevronsDown className="w-12 h-12 text-white/30 animate-bounce" aria-hidden="true" />
                    </div>

                    {/* Results Box */}
                    <div className="bg-gradient-to-b from-white/5 to-transparent border border-gvc-gold/30 rounded-2xl p-8 space-y-8">

                        <h3 className="text-3xl md:text-4xl font-cooper text-white uppercase tracking-wider">PROJECTED IMPACT:</h3>

                        {/* ETH Generated */}
                        <div className="space-y-4">
                            <p className="text-white/60 font-mundial text-sm tracking-wide uppercase">
                                Sweeping <span className="text-white font-bold">{sweepAmount}</span> Strategy GVCs would generate
                            </p>
                            <p className="text-4xl md:text-5xl font-cooper text-gvc-gold">
                                {calculatedResults.ethGenerated.toFixed(2)} ETH
                            </p>
                            <p className="text-gvc-gold/60 font-bold text-sm uppercase">
                                IN BUY/BURN POWER
                            </p>
                        </div>

                        <div className="w-full h-px bg-white/10" />

                        {/* VIBESTR Burned */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-center gap-2">
                                <Flame className="w-6 h-6 text-orange-500 fill-orange-500 animate-pulse" aria-hidden="true" />
                                <p className="text-white/60 font-mundial text-sm tracking-wide uppercase">
                                    THIS WOULD BUY & BURN
                                </p>
                            </div>

                            <p className="text-4xl md:text-6xl font-cooper text-orange-500">
                                {formatNumber(calculatedResults.vibestrBurned)} <span className="text-2xl md:text-3xl">$VIBESTR</span>
                            </p>

                            <div className="inline-block bg-orange-500/10 border border-orange-500/30 px-4 py-2 rounded-full">
                                <p className="text-orange-500 font-mundial font-bold text-sm">
                                    ~{calculatedResults.supplyPercent.toFixed(3)}% of the total supply
                                </p>
                            </div>
                        </div>

                        <div className="w-full h-px bg-white/10" />

                        {/* Price Impact */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-center gap-2">
                                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                <p className="text-white/60 font-mundial text-sm tracking-wide uppercase">
                                    PROJECTED PRICE IMPACT
                                </p>
                            </div>
                            <div className="flex items-center justify-center gap-3 md:gap-6">
                                <div className="text-center">
                                    <p className="text-white/40 text-xs uppercase mb-1">Current</p>
                                    <p className="text-2xl md:text-3xl font-cooper text-white">${calculatedResults.currentPrice.toFixed(5)}</p>
                                </div>
                                <span className="text-green-500 text-2xl font-bold">→</span>
                                <div className="text-center">
                                    <p className="text-white/40 text-xs uppercase mb-1">Projected</p>
                                    <p className="text-2xl md:text-3xl font-cooper text-green-400">${calculatedResults.projectedPrice.toFixed(5)}</p>
                                </div>
                            </div>
                            <div className="inline-block bg-green-500/10 border border-green-500/30 px-4 py-2 rounded-full">
                                <p className="text-green-400 font-mundial font-bold text-sm">
                                    +{calculatedResults.priceIncrease.toFixed(2)}% Price Increase
                                </p>
                            </div>
                        </div>

                    </div>

                </div>
            </motion.div>
        </div>
    );
}
