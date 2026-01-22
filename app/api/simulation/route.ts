import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { createPublicClient, http, formatUnits } from 'viem';
import { mainnet } from 'viem/chains';

const TOKEN_CONTRACT = '0xd0cC2b0eFb168bFe1f94a948D8df70FA10257196' as const;
const BURN_ADDRESS = '0x000000000000000000000000000000000000dEaD' as const;

const erc20Abi = [
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'totalSupply',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'decimals',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint8' }],
    },
] as const;

const client = createPublicClient({
    chain: mainnet,
    transport: http('https://eth.llamarpc.com'),
});

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const totalListingEth = parseFloat(searchParams.get('totalEth') || '0');

        // Fetch current token data from chain
        const [burnedRaw, totalSupplyRaw, decimals] = await Promise.all([
            client.readContract({
                address: TOKEN_CONTRACT,
                abi: erc20Abi,
                functionName: 'balanceOf',
                args: [BURN_ADDRESS],
            }),
            client.readContract({
                address: TOKEN_CONTRACT,
                abi: erc20Abi,
                functionName: 'totalSupply',
            }),
            client.readContract({
                address: TOKEN_CONTRACT,
                abi: erc20Abi,
                functionName: 'decimals',
            }),
        ]);

        const currentBurned = Number(formatUnits(burnedRaw, decimals));
        const totalSupply = Number(formatUnits(totalSupplyRaw, decimals));
        const circulatingSupply = totalSupply - currentBurned;

        // Current market data
        const currentPriceUsd = 0.0106; // $0.0106 per token
        const ethPriceUsd = 3300; // Approximate ETH price
        const currentMarketCap = 8700000; // $8.7M market cap
        const poolLiquidity = 930000; // ~$930K in Uniswap pool (525K + 464K from DexScreener)

        const currentBurnPercentage = (currentBurned / totalSupply) * 100;

        // Calculate total ETH from all NFT listings
        const ethFromSales = totalListingEth;
        const usdFromSales = ethFromSales * ethPriceUsd;

        // Calculate tokens bought with the ETH proceeds (before price impact)
        // Using current price as starting point
        const tokensToBurn = usdFromSales / currentPriceUsd;

        // New burn amounts after all NFTs sold
        const projectedBurned = currentBurned + tokensToBurn;
        const projectedBurnPercentage = (projectedBurned / totalSupply) * 100;
        const projectedCirculating = totalSupply - projectedBurned;

        // Price impact model for AMM:
        // Buy pressure relative to liquidity causes significant price movement
        // Formula approximation: price_multiplier = (1 + buyPressure/liquidity)^2
        // This models the constant product AMM curve impact
        const buyPressureRatio = usdFromSales / poolLiquidity;
        const buyPressureMultiplier = Math.pow(1 + buyPressureRatio, 1.5); // Conservative exponent

        // Supply reduction also increases price (fewer tokens = higher value per token)
        const supplyReductionMultiplier = circulatingSupply / projectedCirculating;

        // Combined price impact: buy pressure + supply reduction
        const totalPriceMultiplier = buyPressureMultiplier * supplyReductionMultiplier;
        const projectedPriceUsd = currentPriceUsd * totalPriceMultiplier;

        // New market cap with projected circulating supply and price
        const projectedMarketCap = projectedCirculating * projectedPriceUsd;

        return NextResponse.json({
            // Current state
            current: {
                burned: currentBurned,
                burnPercentage: currentBurnPercentage,
                circulatingSupply,
                priceUsd: currentPriceUsd,
                marketCap: currentMarketCap,
            },
            // Projected state after wall smash
            projected: {
                burned: projectedBurned,
                burnPercentage: projectedBurnPercentage,
                circulatingSupply: projectedCirculating,
                priceUsd: projectedPriceUsd,
                marketCap: projectedMarketCap,
                tokensBurned: tokensToBurn,
            },
            // Input data
            input: {
                totalListingEth,
                ethPriceUsd,
                usdFromSales,
                buyPressureMultiplier,
                supplyReductionMultiplier,
            }
        });

    } catch (error) {
        console.error('Error calculating simulation:', error);
        return NextResponse.json({ error: 'Failed to calculate simulation' }, { status: 500 });
    }
}
