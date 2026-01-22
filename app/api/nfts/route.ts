import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const OPENSEA_API_KEY = '003c902b643e4b06b14ae18bda215739';
const TARGET_WALLET = '0xd0cc2b0efb168bfe1f94a948d8df70fa10257196';
const GVC_CONTRACT = '0xB8Ea78fcaCEf50d41375E44E6814ebbA36Bb33c4';
const GVC_COLLECTION = 'good-vibes-club';
const MAX_PRICE_ETH = 1;

interface NFTListing {
    id: string;
    name: string;
    image: string;
    price: number;
    openseaUrl: string;
}

// Throttle requests to avoid rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET() {
    try {
        // Step 1: Get all listings from this seller for GVC collection
        let allListings: any[] = [];
        let cursor: string | null = null;

        // Paginate through all listings
        for (let i = 0; i < 15; i++) {
            const listingsUrl = new URL(`https://api.opensea.io/api/v2/listings/collection/${GVC_COLLECTION}/all`);
            listingsUrl.searchParams.set('limit', '100');
            if (cursor) {
                listingsUrl.searchParams.set('next', cursor);
            }

            const listingsResponse = await fetch(listingsUrl.toString(), {
                headers: {
                    'accept': 'application/json',
                    'x-api-key': OPENSEA_API_KEY
                },
                next: { revalidate: 60 } // Cache for 60 seconds
            });

            if (!listingsResponse.ok) {
                console.error('OpenSea Listings API Error:', listingsResponse.status);
                break;
            }

            const listingsData = await listingsResponse.json();
            const listings = listingsData.listings || [];

            // Filter to only listings from our target wallet and ≤1 ETH
            const relevantListings = listings.filter((listing: any) => {
                const maker = listing.protocol_data?.parameters?.offerer?.toLowerCase();
                const priceWei = BigInt(listing.price?.current?.value || '0');
                const priceEth = Number(priceWei) / 1e18;

                return maker === TARGET_WALLET.toLowerCase() && priceEth <= MAX_PRICE_ETH;
            });

            allListings = [...allListings, ...relevantListings];

            cursor = listingsData.next;
            if (!cursor) break;

            // Reduced delay for pagination since we cache
            await delay(100);
        }

        if (allListings.length === 0) {
            return NextResponse.json({ nfts: [], count: 0 });
        }

        // Step 2: Get NFT metadata for each listing
        const nftMap = new Map<string, NFTListing>();

        for (const listing of allListings) {
            const tokenId = listing.protocol_data?.parameters?.offer?.[0]?.identifierOrCriteria;
            if (!tokenId) continue;

            const priceWei = BigInt(listing.price?.current?.value || '0');
            const priceEth = Number(priceWei) / 1e18;

            // Skip if already have this NFT with a lower price
            const existing = nftMap.get(tokenId);
            if (existing && existing.price <= priceEth) continue;

            nftMap.set(tokenId, {
                id: tokenId,
                name: `Citizen of Vibetown #${tokenId}`,
                image: `https://i.seadn.io/s/raw/files/good-vibes-club/${tokenId}.png`,
                price: priceEth,
                openseaUrl: `https://opensea.io/assets/ethereum/${GVC_CONTRACT}/${tokenId}`
            });
        }

        // Step 3: Fetch actual NFT images from OpenSea in PARALLEL batches
        const tokenIds = Array.from(nftMap.keys());
        const BATCH_SIZE = 5;

        for (let i = 0; i < tokenIds.length; i += BATCH_SIZE) {
            const batch = tokenIds.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(async (tokenId) => {
                try {
                    const nftUrl = `https://api.opensea.io/api/v2/chain/ethereum/contract/${GVC_CONTRACT}/nfts/${tokenId}`;
                    const nftResponse = await fetch(nftUrl, {
                        headers: {
                            'accept': 'application/json',
                            'x-api-key': OPENSEA_API_KEY
                        },
                        next: { revalidate: 3600 } // Cache image URLs for 1 hour (they don't change)
                    });

                    if (nftResponse.ok) {
                        const nftData = await nftResponse.json();
                        const nft = nftMap.get(tokenId);
                        if (nft && nftData.nft) {
                            nft.name = nftData.nft.name || nft.name;
                            nft.image = nftData.nft.image_url || nftData.nft.display_image_url || nft.image;
                        }
                    }
                } catch (e) {
                    // Continue with default data
                }
            }));

            // Small delay between batches to be nice to the API
            if (i + BATCH_SIZE < tokenIds.length) await delay(100);
        }

        const nftsArray = Array.from(nftMap.values())
            .sort((a, b) => a.price - b.price);

        return NextResponse.json({
            nfts: nftsArray,
            count: nftsArray.length
        });

    } catch (error) {
        console.error('Error fetching NFT data:', error);
        return NextResponse.json({ nfts: [], count: 0, error: 'Internal error' }, { status: 500 });
    }
}

