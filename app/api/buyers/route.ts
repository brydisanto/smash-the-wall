import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const OPENSEA_API_KEY = '003c902b643e4b06b14ae18bda215739';
const SELLER_WALLET = '0xd0cc2b0efb168bfe1f94a948d8df70fa10257196';

interface BuyerStats {
    address: string;
    username: string | null;
    display: string;
    purchaseCount: number;
    totalSpentEth: number;
    vibestrBurned: number;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Cache for resolved usernames
const usernameCache = new Map<string, string | null>();

async function resolveUsername(address: string): Promise<string | null> {
    if (usernameCache.has(address)) {
        return usernameCache.get(address) || null;
    }

    try {
        const url = `https://api.opensea.io/api/v2/accounts/${address}`;
        const response = await fetch(url, {
            headers: {
                'accept': 'application/json',
                'x-api-key': OPENSEA_API_KEY
            },
            next: { revalidate: 3600 } // Cache usernames for 1 hour
        });

        if (response.ok) {
            const data = await response.json();
            const username = data.username || null;
            usernameCache.set(address, username);
            return username;
        }
    } catch (e) {
        // Ignore errors
    }

    usernameCache.set(address, null);
    return null;
}

function formatAddress(address: string): string {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

export async function GET() {
    try {
        // Fetch sale events where our target wallet was the seller
        let allSales: any[] = [];
        let cursor: string | null = null;

        // Paginate through sales events in batches or reduce page count if cached
        for (let i = 0; i < 5; i++) { // Reduced to 5 pages per request for speed, cache helps
            const eventsUrl = new URL(`https://api.opensea.io/api/v2/events/accounts/${SELLER_WALLET}`);
            eventsUrl.searchParams.set('event_type', 'sale');
            eventsUrl.searchParams.set('limit', '50');
            if (cursor) {
                eventsUrl.searchParams.set('next', cursor);
            }

            const response = await fetch(eventsUrl.toString(), {
                headers: {
                    'accept': 'application/json',
                    'x-api-key': OPENSEA_API_KEY
                },
                next: { revalidate: 60 } // Cache sales for 60 seconds
            });

            if (!response.ok) {
                console.error('OpenSea Events API Error:', response.status);
                break;
            }

            const data = await response.json();
            const events = data.asset_events || [];

            // Only include sales where seller matches our target (they sold)
            const relevantSales = events.filter((event: any) =>
                event.seller?.toLowerCase() === SELLER_WALLET.toLowerCase()
            );

            allSales = [...allSales, ...relevantSales];

            cursor = data.next;
            if (!cursor) break;

            await delay(100); // Reduced delay
        }

        if (allSales.length === 0) {
            return NextResponse.json({ buyers: [], totalSales: 0 });
        }

        // Aggregate by buyer
        const buyerMap = new Map<string, { address: string; count: number; totalWei: bigint }>();

        for (const sale of allSales) {
            const buyerAddress = sale.buyer?.toLowerCase();
            if (!buyerAddress) continue;

            const priceWei = BigInt(sale.payment?.quantity || '0');

            const existing = buyerMap.get(buyerAddress);
            if (existing) {
                existing.count += 1;
                existing.totalWei += priceWei;
            } else {
                buyerMap.set(buyerAddress, {
                    address: buyerAddress,
                    count: 1,
                    totalWei: priceWei
                });
            }
        }

        // Convert to array and sort by count (then by ETH spent)
        const sortedBuyers = Array.from(buyerMap.values())
            .sort((a, b) => {
                if (b.count !== a.count) return b.count - a.count;
                return Number(b.totalWei - a.totalWei);
            })
            .slice(0, 20); // Top 20 buyers

        // Resolve usernames for top buyers in PARALLEL batches
        const buyersWithNames: BuyerStats[] = [];
        const BATCH_SIZE = 5;

        for (let i = 0; i < sortedBuyers.length; i += BATCH_SIZE) {
            const batch = sortedBuyers.slice(i, i + BATCH_SIZE);
            const resolvedBatch = await Promise.all(batch.map(async (buyer) => {
                const username = await resolveUsername(buyer.address);
                const totalSpentEth = Number(buyer.totalWei) / 1e18;

                // Estimate VIBESTR burned (approximate)
                const ethPriceUsd = 3300;
                const vibestrPriceUsd = 0.0106;
                const vibestrBurned = (totalSpentEth * ethPriceUsd) / vibestrPriceUsd;

                return {
                    address: buyer.address,
                    username,
                    display: username || formatAddress(buyer.address),
                    purchaseCount: buyer.count,
                    totalSpentEth,
                    vibestrBurned
                };
            }));

            buyersWithNames.push(...resolvedBatch);

            // Minimal delay between batches
            if (i + BATCH_SIZE < sortedBuyers.length) await delay(50);
        }

        return NextResponse.json({
            buyers: buyersWithNames,
            totalSales: allSales.length
        });

    } catch (error) {
        console.error('Error fetching buyers data:', error);
        return NextResponse.json({ buyers: [], totalSales: 0, error: 'Internal error' }, { status: 500 });
    }
}
