"use client";

import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface DashboardLayoutProps {
    children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="flex min-h-screen bg-[var(--bg-primary)]">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                {/* Mobile Header (visible only on small screens) */}
                <header className="md:hidden glass-panel rounded-none border-x-0 border-t-0 p-4 sticky top-0 z-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
                            <div className="text-white font-bold">M</div>
                        </div>
                        <span className="font-bold text-white">Energy Tracker</span>
                    </div>
                    <button className="text-[var(--text-muted)] p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
                    </button>
                </header>

                <div className="p-4 md:p-8 max-w-7xl mx-auto w-full animate-fade-in relative z-10">
                    {children}
                </div>
            </main>
        </div>
    );
}
