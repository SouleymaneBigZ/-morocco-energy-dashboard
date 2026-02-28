"use client";

import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useSync } from "@/context/SyncContext";
import { PauseCircle } from "lucide-react";

interface DashboardLayoutProps {
    children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const { isLiveSyncEnabled, toggleLiveSync } = useSync();

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
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
                    </button>
                </header>

                {/* Global Top Bar (visible on md+) */}
                <div className="hidden md:flex justify-end p-4 md:px-8 max-w-7xl mx-auto w-full sticky top-0 z-40">
                    <button
                        onClick={toggleLiveSync}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 shadow-lg backdrop-blur-md ${isLiveSyncEnabled
                            ? 'bg-[var(--surface)] hover:bg-[var(--surface-border)] border-[var(--surface-border)] shadow-emerald-500/10'
                            : 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20 shadow-red-500/10'
                            }`}
                    >
                        {isLiveSyncEnabled ? (
                            <>
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                                <span className="text-sm font-medium text-emerald-400">Live Data Sync: ON</span>
                            </>
                        ) : (
                            <>
                                <PauseCircle size={16} className="text-red-400" />
                                <span className="text-sm font-medium text-red-400">Live Data Sync: PAUSED</span>
                            </>
                        )}
                    </button>
                </div>

                <div className="p-4 md:p-8 max-w-7xl mx-auto w-full animate-fade-in relative z-10">
                    {children}
                </div>
            </main>
        </div>
    );
}
