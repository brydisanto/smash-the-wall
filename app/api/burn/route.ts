import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { createPublicClient, http, formatUnits } from 'viem';
import { mainnet } from 'viem/chains';

const TOKEN_CONTRACT = '0xd0cC2b0eFb168bFe1f94a948D8df70FA10257196' as const;
const BURN_ADDRESS = '0x000000000000000000000000000000000000dEaD' as const;

// ERC20 ABI for the functions we need
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

export async function GET() {
    try {
        // Fetch all data in parallel
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

        const burned = Number(formatUnits(burnedRaw, decimals));
        const totalSupply = Number(formatUnits(totalSupplyRaw, decimals));
        const burnPercentage = totalSupply > 0 ? (burned / totalSupply) * 100 : 0;

        return NextResponse.json(
            {
                burned: burned,
                totalSupply: totalSupply,
                burnPercentage: burnPercentage,
                decimals: decimals,
            },
            {
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                    'CDN-Cache-Control': 'no-store',
                    'Vercel-CDN-Cache-Control': 'no-store',
                    'Pragma': 'no-cache',
                },
            }
        );

    } catch (error) {
        console.error('Error fetching burn data:', error);
        return NextResponse.json(
            { burned: 0, totalSupply: 0, burnPercentage: 0, error: 'Failed to fetch burn data' },
            { status: 500 }
        );
    }
}
