'use client';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { CreatePostModalProvider } from "@/contexts/CreatePostModalContext";
import GoogleOneTap from "@/components/auth/GoogleOneTap";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
                <AuthProvider>
                    <CreatePostModalProvider>
                        <TooltipProvider>
                            {children}
                            <GoogleOneTap />
                        </TooltipProvider>
                    </CreatePostModalProvider>
                </AuthProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}
