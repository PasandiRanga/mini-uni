import type { Metadata } from "next";
// Poppins is bundled with the app (self-hosted), not fetched from Google at
// page load: no render-blocking third-party request, and it works offline.
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/400-italic.css";
import "@fontsource/poppins/500-italic.css";
import "@fontsource/poppins/600-italic.css";
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
        <html lang="en" suppressHydrationWarning>
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
