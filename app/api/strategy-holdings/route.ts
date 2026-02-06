import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const OPENSEA_API_KEY = '003c902b643e4b06b14ae18bda215739';
const STRATEGY_WALLET = '0xd0cc2b0efb168bfe1f94a948d8df70fa10257196';
const COLLECTION_SLUG = 'good-vibes-club';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET() {
    try {
        const listings: number[] = [];
        let cursor: string | null = null;

        // Fetch all listings for the collection and filter by maker
        for (let i = 0; i < 10; i++) {
            const url = new URL(`https://api.opensea.io/api/v2/listings/collection/${COLLECTION_SLUG}/all`);
            url.searchParams.set('limit', '50');

            if (cursor) {
                url.searchParams.set('next', cursor);
            }

            let response = await fetch(url.toString(), {
                headers: {
                    'accept': 'application/json',
                    'x-api-key': OPENSEA_API_KEY,
                },
                next: { revalidate: 60 },
            });

            if (response.status === 429) {
                await delay(2000);
                response = await fetch(url.toString(), {
                    headers: {
                        'accept': 'application/json',
                        'x-api-key': OPENSEA_API_KEY,
                    },
                    next: { revalidate: 60 },
                });
            }

            if (!response.ok) {
                console.error('OpenSea Listing Error:', await response.text());
                break;
            }

            const data = await response.json();
            const orders = data.listings || [];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            orders.forEach((order: any) => {
                const offerer = order.protocol_data?.parameters?.offerer?.toLowerCase();
                if (offerer === STRATEGY_WALLET.toLowerCase()) {
                    const priceValue = order.price?.current?.value;
                    if (priceValue) {
                        const price = parseFloat(priceValue) / 1e18; // Wei to ETH
                        if (!isNaN(price)) {
                            listings.push(price);
                        }
                    }
                }
            });

            cursor = data.next;
            if (!cursor) break;
            await delay(200);
        }

        listings.sort((a, b) => a - b);

        // Count listings <= 1 ETH per user request
        const filteredListings = listings.filter(p => p <= 1.0);
        const totalCount = filteredListings.length;

        return NextResponse.json({
            count: totalCount,
            listings: filteredListings,
            floorPrice: filteredListings[0] || 0
        });

    } catch (error) {
        console.error('Error in strategy-holdings API:', error);
        return NextResponse.json({ count: 0, listings: [], floorPrice: 0, error: 'Internal Server Error' }, { status: 500 });
    }
}
