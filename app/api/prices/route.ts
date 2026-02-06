import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Token addresses
const VIBESTR_CONTRACT = '0xd0cC2b0eFb168bFe1f94a948D8df70FA10257196';
const PNKSTR_CONTRACT = '0xc50673EDb3A7b94E8CAD8a7d4E0cD68864E33eDF';

export async function GET() {
    try {
        // Fetch ETH price from CoinGecko
        const ethPriceRes = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
            { next: { revalidate: 60 } }
        );
        const ethPriceData = await ethPriceRes.json();
        const ethUsd = ethPriceData?.ethereum?.usd || 0;

        // Try to get token prices from DexScreener (works for DEX-traded tokens)
        let vibestrUsd = 0;
        let pnkstrUsd = 0;

        try {
            const vibestrRes = await fetch(
                `https://api.dexscreener.com/latest/dex/tokens/${VIBESTR_CONTRACT}`,
                { next: { revalidate: 60 } }
            );
            const vibestrData = await vibestrRes.json();
            if (vibestrData?.pairs?.[0]?.priceUsd) {
                vibestrUsd = parseFloat(vibestrData.pairs[0].priceUsd);
            }
        } catch (e) {
            console.error('Failed to fetch VIBESTR price:', e);
        }

        try {
            const pnkstrRes = await fetch(
                `https://api.dexscreener.com/latest/dex/tokens/${PNKSTR_CONTRACT}`,
                { next: { revalidate: 60 } }
            );
            const pnkstrData = await pnkstrRes.json();
            if (pnkstrData?.pairs?.[0]?.priceUsd) {
                pnkstrUsd = parseFloat(pnkstrData.pairs[0].priceUsd);
            }
        } catch (e) {
            console.error('Failed to fetch PNKSTR price:', e);
        }

        return NextResponse.json({
            ethUsd,
            vibestrUsd,
            pnkstrUsd,
        });

    } catch (error) {
        console.error('Error fetching prices:', error);
        return NextResponse.json(
            { ethUsd: 0, vibestrUsd: 0, pnkstrUsd: 0, error: 'Failed to fetch prices' },
            { status: 500 }
        );
    }
}
