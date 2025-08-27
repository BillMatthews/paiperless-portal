"use client"

import React from "react";
import {Sidebar} from "@/components/sidebar";
import {ThemeProvider} from "next-themes";
import {ThemeToggle} from "@/components/theme-toggle";

interface AppLayoutProps {
    children: React.ReactNode;
}

export function AppLayout({children}: AppLayoutProps) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <div className="flex min-h-screen bg-background text-foreground">
                <Sidebar/>
                <div className="flex-1 p-8 relative">
                    <div className="absolute top-4 right-4 z-10">
                        <ThemeToggle/>
                    </div>
                    {children}
                </div>
            </div>
        </ThemeProvider>
    )
}


