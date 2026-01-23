import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const OPENSEA_API_KEY = '003c902b643e4b06b14ae18bda215739';
const SELLER_WALLET = '0xd0cc2b0efb168bfe1f94a948d8df70fa10257196';

interface Sale {
    buyer: string;
    buyerName: string;
    tokenId: string;
    priceEth: number;
    timestamp: number;
    imageUrl: string | null;
}

function formatAddress(address: string): string {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

export async function GET() {
    try {
        // Fetch recent sale events from Strategy wallet
        const eventsUrl = new URL(`https://api.opensea.io/api/v2/events/accounts/${SELLER_WALLET}`);
        eventsUrl.searchParams.set('event_type', 'sale');
        eventsUrl.searchParams.set('limit', '10'); // Last 10 sales

        const response = await fetch(eventsUrl.toString(), {
            headers: {
                'accept': 'application/json',
                'x-api-key': OPENSEA_API_KEY
            },
            next: { revalidate: 30 } // Cache for 30 seconds
        });

        if (!response.ok) {
            console.error('OpenSea Events API Error:', response.status);
            return NextResponse.json({ sales: [] });
        }

        const data = await response.json();
        const events = data.asset_events || [];

        // Filter and format sales
        const sales: Sale[] = [];

        for (const event of events) {
            if (event.seller?.toLowerCase() !== SELLER_WALLET.toLowerCase()) continue;

            const buyerAddress = event.buyer?.toLowerCase() || '';
            const priceWei = BigInt(event.payment?.quantity || '0');
            const priceEth = Number(priceWei) / 1e18;

            // Extract token ID and image from the NFT info
            const tokenId = event.nft?.identifier || 'Unknown';
            const imageUrl = event.nft?.image_url || event.nft?.display_image_url || null;

            // Get timestamp
            const timestamp = event.event_timestamp ? new Date(event.event_timestamp).getTime() : Date.now();

            sales.push({
                buyer: buyerAddress,
                buyerName: formatAddress(buyerAddress),
                tokenId,
                priceEth,
                timestamp,
                imageUrl
            });
        }

        return NextResponse.json({ sales });

    } catch (error) {
        console.error('Error fetching sales:', error);
        return NextResponse.json({ sales: [], error: 'Internal error' }, { status: 500 });
    }
}
