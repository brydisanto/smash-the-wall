

const OPENSEA_API_KEY = '003c902b643e4b06b14ae18bda215739';
const GVC_COLLECTION = 'good-vibes-club';

async function testFetch() {
    console.log("Starting fetch...");
    let allListings = [];
    let cursor = null;
    let page = 0;

    while (true) {
        page++;
        if (page > 50) break;

        const url = `https://api.opensea.io/api/v2/listings/collection/${GVC_COLLECTION}/all?limit=100${cursor ? `&next=${cursor}` : ''}`;
        console.log(`Fetching page ${page}...`);

        try {
            const response = await fetch(url, {
                headers: {
                    'accept': 'application/json',
                    'x-api-key': OPENSEA_API_KEY
                }
            });

            if (!response.ok) {
                console.error(`Error: ${response.status} ${response.statusText}`);
                const text = await response.text();
                console.error(text);
                break;
            }

            const data = await response.json();
            const listings = data.listings || [];
            console.log(`Page ${page}: Got ${listings.length} listings`);

            if (listings.length === 0) break;

            const filtered = listings.filter(l => {
                // Check currency (only ETH/WETH)
                const currency = l.price?.current?.currency?.toUpperCase();
                if (currency !== 'ETH' && currency !== 'WETH') return false;

                // Check price
                const priceWei = BigInt(l.price?.current?.value || '0');
                const priceEth = Number(priceWei) / 1e18;
                return priceEth <= 1;
            });
            console.log(`Page ${page}: ${filtered.length} match <= 1 ETH`);

            allListings = [...allListings, ...filtered];
            cursor = data.next;
            if (!cursor) {
                console.log("No next cursor. Finished.");
                break;
            }

            await new Promise(r => setTimeout(r, 300));

        } catch (e) {
            console.error(e);
            break;
        }
    }

    // Deduplicate
    const uniqueIds = new Set();
    allListings.forEach(l => {
        const tokenId = l.protocol_data?.parameters?.offer?.[0]?.identifierOrCriteria;
        if (tokenId) uniqueIds.add(tokenId);
    });

    console.log('Final Count:', uniqueIds.size);
    console.log('Total Raw Listings Fetched:', allListings.length);
}

testFetch();
