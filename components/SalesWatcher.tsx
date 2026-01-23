'use client';

import { useEffect, useRef } from 'react';
import { useToast } from './ToastProvider';

interface Sale {
    buyer: string;
    buyerName: string;
    tokenId: string;
    priceEth: number;
    timestamp: number;
}

export default function SalesWatcher() {
    const { showSaleToast } = useToast();
    const lastSaleTimestampRef = useRef<number>(0);
    const isFirstFetchRef = useRef(true);

    useEffect(() => {
        const checkForNewSales = async () => {
            try {
                const res = await fetch('/api/sales');
                const data = await res.json();
                const recentSales: Sale[] = data.sales || [];

                if (isFirstFetchRef.current) {
                    // On first fetch, just record the latest timestamp
                    if (recentSales.length > 0) {
                        lastSaleTimestampRef.current = Math.max(...recentSales.map(s => s.timestamp));
                    }
                    isFirstFetchRef.current = false;
                    return;
                }

                // Find new sales since last check
                const newSales = recentSales.filter(sale => sale.timestamp > lastSaleTimestampRef.current);

                // Show toast for each new sale
                for (const sale of newSales) {
                    showSaleToast({
                        buyerName: sale.buyerName,
                        nftId: sale.tokenId,
                        priceEth: sale.priceEth
                    });
                }

                // Update last timestamp
                if (recentSales.length > 0) {
                    lastSaleTimestampRef.current = Math.max(...recentSales.map(s => s.timestamp));
                }
            } catch (error) {
                console.error('Failed to check for new sales:', error);
            }
        };

        // Initial check
        checkForNewSales();

        // Poll every 30 seconds
        const interval = setInterval(checkForNewSales, 30000);
        return () => clearInterval(interval);
    }, [showSaleToast]);

    return null; // This component doesn't render anything
}
