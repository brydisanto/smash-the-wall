import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const OPENSEA_API_KEY = '003c902b643e4b06b14ae18bda215739';
const SELLER_WALLET = '0xd0cc2b0efb168bfe1f94a948d8df70fa10257196';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET() {
    try {
        // Get timestamp for 24 hours ago
        const now = Math.floor(Date.now() / 1000);
        const oneDayAgo = now - (24 * 60 * 60);

        // Fetch sale events from last 24 hours
        let salesCount = 0;
        let totalEthBurned = 0;
        let cursor: string | null = null;

        for (let i = 0; i < 5; i++) { // Max 5 pages
            const eventsUrl = new URL(`https://api.opensea.io/api/v2/events/accounts/${SELLER_WALLET}`);
            eventsUrl.searchParams.set('event_type', 'sale');
            eventsUrl.searchParams.set('after', oneDayAgo.toString());
            eventsUrl.searchParams.set('limit', '50');
            if (cursor) {
                eventsUrl.searchParams.set('next', cursor);
            }

            const response = await fetch(eventsUrl.toString(), {
                headers: {
                    'accept': 'application/json',
                    'x-api-key': OPENSEA_API_KEY
                }
            });

            if (!response.ok) {
                console.error('OpenSea Events API Error:', response.status);
                break;
            }

            const data = await response.json();
            const events = data.asset_events || [];

            // Count sales where our wallet was the seller
            for (const event of events) {
                if (event.seller?.toLowerCase() === SELLER_WALLET.toLowerCase()) {
                    salesCount++;
                    const priceWei = BigInt(event.payment?.quantity || '0');
                    totalEthBurned += Number(priceWei) / 1e18;
                }
            }

            cursor = data.next;
            if (!cursor) break;

            await delay(300);
        }

        // Estimate VIBESTR burned from ETH (using current price ~$0.0106)
        const ethPriceUsd = 3300;
        const vibestrPriceUsd = 0.0106;
        const usdFromSales = totalEthBurned * ethPriceUsd;
        const vibestrBurned24h = usdFromSales / vibestrPriceUsd;

        return NextResponse.json({
            gvcsSold24h: salesCount,
            ethSpent24h: totalEthBurned,
            vibestrBurned24h: vibestrBurned24h,
        });

    } catch (error) {
        console.error('Error fetching 24h changes:', error);
        return NextResponse.json({
            gvcsSold24h: 0,
            ethSpent24h: 0,
            vibestrBurned24h: 0,
            error: 'Failed to fetch changes'
        }, { status: 500 });
    }
}
