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
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Cache for resolved usernames
const usernameCache = new Map<string, string | null>();

async function resolveUsername(address: string): Promise<string | null> {
    if (usernameCache.has(address)) {
        return usernameCache.get(address) || null;
    }

    try {
        await delay(100);
        const url = `https://api.opensea.io/api/v2/accounts/${address}`;
        const response = await fetch(url, {
            headers: {
                'accept': 'application/json',
                'x-api-key': OPENSEA_API_KEY
            }
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

        // Paginate through sales events
        for (let i = 0; i < 10; i++) { // Max 10 pages
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
                }
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

            await delay(300);
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

        // Resolve usernames for top buyers
        const buyersWithNames: BuyerStats[] = [];
        for (const buyer of sortedBuyers) {
            const username = await resolveUsername(buyer.address);
            const totalSpentEth = Number(buyer.totalWei) / 1e18;

            buyersWithNames.push({
                address: buyer.address,
                username,
                display: username || formatAddress(buyer.address),
                purchaseCount: buyer.count,
                totalSpentEth
            });
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
