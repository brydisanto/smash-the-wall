/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'i.seadn.io',
            },
            {
                protocol: 'https',
                hostname: 'openseauserdata.com',
            },
            {
                protocol: 'https',
                hostname: '*.seadn.io',
            },
        ],
    },
};

export default nextConfig;
