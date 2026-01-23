import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const OPENSEA_API_KEY = '003c902b643e4b06b14ae18bda215739';
const GVC_COLLECTION = 'good-vibes-club';

// Set max execution time to 60s (Vercel Pro/Enterprise specific, but good practice)
export const maxDuration = 60;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET() {
    try {
        // Fetch all active listings for GVC collection
        let allListings: any[] = [];
        let cursor: string | null = null;
        const MAX_PAGES = 50;

        for (let i = 0; i < MAX_PAGES; i++) {
            const listingsUrl = new URL(`https://api.opensea.io/api/v2/listings/collection/${GVC_COLLECTION}/all`);
            listingsUrl.searchParams.set('limit', '100');
            if (cursor) {
                listingsUrl.searchParams.set('next', cursor);
            }

            let response = await fetch(listingsUrl.toString(), {
                headers: {
                    'accept': 'application/json',
                    'x-api-key': OPENSEA_API_KEY
                }
            });

            // Handle Rate Limit (429)
            if (response.status === 429) {
                console.warn('Rate limit hit, waiting 2s...');
                await delay(2000);
                response = await fetch(listingsUrl.toString(), {
                    headers: {
                        'accept': 'application/json',
                        'x-api-key': OPENSEA_API_KEY
                    }
                });
            }

            if (!response.ok) {
                console.error('OpenSea Listings API Error:', response.status);
                break;
            }

            const data = await response.json();
            const listings = data.listings || [];

            // Filter to active listings ≤1 ETH with correct currency
            const filteredListings = listings.filter((listing: any) => {
                // Check currency (only ETH/WETH)
                const currency = listing.price?.current?.currency?.toUpperCase();
                if (currency !== 'ETH' && currency !== 'WETH') return false;

                // Check price
                const priceWei = BigInt(listing.price?.current?.value || '0');
                const priceEth = Number(priceWei) / 1e18;
                return priceEth <= 1;
            });

            allListings = [...allListings, ...filteredListings];

            cursor = data.next;
            if (!cursor) break;

            // Adaptive delay to avoid rate limits
            await delay(1000); // Wait 1s between pages
        }

        // Deduplicate listings by Token ID to get accurate item count
        const uniqueTokenIds = new Set<string>();
        let lowestFlorPrice = Infinity;

        for (const listing of allListings) {
            // Seaport / standard listing token ID location
            const tokenId = listing.protocol_data?.parameters?.offer?.[0]?.identifierOrCriteria;
            if (tokenId) {
                uniqueTokenIds.add(tokenId);
            }

            // Calculate floor from all valid listings
            const priceWei = BigInt(listing.price?.current?.value || '0');
            const priceEth = Number(priceWei) / 1e18;
            if (priceEth < lowestFlorPrice && priceEth > 0) {
                lowestFlorPrice = priceEth;
            }
        }

        const totalListings = uniqueTokenIds.size;
        const floorPrice = lowestFlorPrice === Infinity ? 0 : lowestFlorPrice;

        return NextResponse.json({
            totalListings,
            floorPrice,
        });

    } catch (error) {
        console.error('Error fetching collection stats:', error);
        return NextResponse.json({
            totalListings: 0,
            floorPrice: 0,
            error: 'Failed to fetch collection stats'
        }, { status: 500 });
    }
}
