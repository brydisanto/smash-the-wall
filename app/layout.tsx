import type { Metadata } from "next";
import { Inter, Titan_One, Outfit } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const titan = Titan_One({ weight: "400", subsets: ["latin"], variable: "--font-titan" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

const brice = localFont({
    src: [
        { path: "../public/fonts/Brice-Bold.otf", weight: "700", style: "normal" },
        { path: "../public/fonts/Brice-Black.otf", weight: "900", style: "normal" }
    ],
    variable: "--font-brice"
});

const mundial = localFont({
    src: [
        { path: "../public/fonts/Mundial-Regular.otf", weight: "400", style: "normal" },
        { path: "../public/fonts/MundialDemibold.otf", weight: "600", style: "normal" },
        { path: "../public/fonts/Mundial-Bold.otf", weight: "700", style: "normal" }
    ],
    variable: "--font-mundial"
});

export const metadata: Metadata = {
    title: "SMASH THE WALL",
    description: "Break through barriers",
    icons: {
        icon: '/favicon.ico',
    }
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.className} ${outfit.variable} ${mundial.variable} ${titan.variable} ${brice.variable} min-h-screen bg-gvc-black text-white selection:bg-gvc-gold selection:text-black font-sans`}>
                {children}
            </body>
        </html>
    );
}
