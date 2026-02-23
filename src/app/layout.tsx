import type { Metadata } from "next";
import "@/index.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

export const metadata: Metadata = {
    title: "MiniUni - Find Verified Teachers & Learn Anything",
    description: "Connect with verified teachers in your area. Post what you want to learn, find the perfect teacher, and book classes instantly with secure payments and video calls.",
    keywords: ["tutoring", "online classes", "find teachers", "learn", "education", "private lessons", "verified teachers"],
    openGraph: {
        title: "MiniUni - Find Verified Teachers & Learn Anything",
        description: "Connect with verified teachers in your area. Post what you want to learn, find the perfect teacher, and book classes instantly.",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        site: "@miniuni",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                <Providers>
                    {children}
                    <Toaster />
                    <Sonner />
                </Providers>
            </body>
        </html>
    );
}
