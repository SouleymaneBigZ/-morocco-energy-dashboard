"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    BarChart3,
    Map,
    Settings,
    Zap,
    Briefcase,
    FileText
} from "lucide-react";

export function Sidebar() {
    const pathname = usePathname();

    const navItems = [
        { label: "Overview", icon: BarChart3, href: "/" },
        { label: "Projects Map", icon: Map, href: "/projects" },
        { label: "Financials", icon: Briefcase, href: "/financials" },
        { label: "Regulations", icon: FileText, href: "/regulations" },
    ];

    return (
        <aside className="w-64 glass-panel border-l-0 border-y-0 border-r border-[var(--surface-border)] hidden md:flex flex-col h-screen sticky top-0">
            <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Zap className="text-white w-6 h-6" />
                </div>
                <div>
                    <h1 className="font-bold text-lg leading-tight text-white">Morocco</h1>
                    <p className="text-xs text-emerald-400 font-medium tracking-wider">ENERGY TRACKER</p>
                </div>
            </div>

            <nav className="flex-1 px-4 py-8 flex flex-col gap-2">
                <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider px-2">Menu</div>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${isActive
                                    ? "bg-slate-800/80 text-white shadow-sm border border-slate-700/50"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? "text-emerald-400" : ""}`} />
                            <span className="font-medium text-sm">{item.label}</span>
                            {isActive && (
                                <div className="ml-auto w-1.5 h-4 rounded-full bg-emerald-400"></div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 mt-auto">
                <button className="flex items-center gap-3 px-3 py-3 w-full rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/40 transition-colors">
                    <Settings className="w-5 h-5" />
                    <span className="font-medium text-sm">Settings</span>
                </button>
            </div>
        </aside>
    );
}
