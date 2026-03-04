"use client";

import { useState, useEffect, useCallback } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Briefcase, RefreshCw, BookOpen, Minus } from "lucide-react";
import { useSync } from "@/context/SyncContext";

interface FinancialItem {
    id: number;
    category: string;
    amountBillionUSD: number;
    color: string;
    source: string | null;
    year: number | null;
    yoy_growth_pct: number | null;
}

export function FinancialsDashboard() {
    const [investmentDistribution, setInvestmentDistribution] = useState < FinancialItem[] > ([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState < Date | null > (null);
    const [selectedItem, setSelectedItem] = useState < FinancialItem | null > (null);
    const { isLiveSyncEnabled } = useSync();

    const fetchFinancials = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:8000/api/financials');
            if (response.ok) {
                const data: FinancialItem[] = await response.json();
                setInvestmentDistribution(data);
                setLastUpdated(new Date());
            }
        } catch (error) {
            console.error("Error fetching financials data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFinancials();

        let interval: NodeJS.Timeout;
        if (isLiveSyncEnabled) {
            interval = setInterval(fetchFinancials, 10000);
        }
        return () => clearInterval(interval);
    }, [isLiveSyncEnabled, fetchFinancials]);

    const totalInvestment = investmentDistribution.reduce((sum, item) => sum + item.amountBillionUSD, 0);

    // Separate major sectors from individual financing lines
    const majorSectors = investmentDistribution.filter(d => d.amountBillionUSD >= 1.0);
    const newFinancingLines = investmentDistribution.filter(d => d.amountBillionUSD < 1.0);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-[var(--surface-border)] border-t-[var(--primary)] rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Financial Overview</h1>
                    <p className="text-[var(--text-muted)]">Investment distribution and financing across Morocco&apos;s energy transition</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    {isLiveSyncEnabled && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            LIVE SYNC ACTIVE
                        </div>
                    )}
                    <button
                        onClick={fetchFinancials}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--surface-border)] text-[var(--text-muted)] hover:text-white text-xs font-medium transition-colors"
                    >
                        <RefreshCw size={12} />
                        Refresh
                    </button>
                    <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--surface-border)] rounded-full px-4 py-2">
                        <span className="text-sm font-medium text-[var(--text-muted)]">Values in USD (Billions)</span>
                    </div>
                </div>
            </div>

            {/* Last updated banner */}
            {lastUpdated && (
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-2">
                    <RefreshCw size={11} />
                    Last updated: {lastUpdated.toLocaleTimeString()} — Sources: ONEE, MASEN, EIB, KfW, World Bank (2024-2025)
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Total Investment Summary Card */}
                <div className="md:col-span-1 glass-panel p-6 flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-[var(--secondary)] rounded-full blur-3xl opacity-20 pointer-events-none"></div>

                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400">
                            <DollarSign size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-white">Total Portfolio</h3>
                    </div>

                    <div className="mt-4">
                        <span className="text-5xl font-bold text-white tracking-tighter">${totalInvestment.toFixed(1)}</span>
                        <span className="text-xl text-[var(--text-muted)] ml-2">Billion</span>
                    </div>

                    <div className="mt-4 text-xs text-[var(--text-muted)]">
                        Across {investmentDistribution.length} active investment lines
                    </div>

                    <div className="mt-4 pt-4 border-t border-[var(--surface-border)]">
                        <div className="flex items-center gap-2 text-sm text-emerald-400">
                            <TrendingUp size={16} />
                            <span className="font-medium">Green H₂ growth +110% YoY</span>
                        </div>
                        <div className="text-xs text-[var(--text-muted)] mt-1">Source: Govt. — Mar 2025</div>
                    </div>
                </div>

                {/* Investment Distribution Chart — Major Sectors */}
                <div className="md:col-span-2 glass-panel p-6">
                    <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                        <span className="w-1 h-6 rounded-full bg-[var(--secondary)]"></span>
                        Capital Allocation by Sector ≥ $1B
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mb-4">Click a bar to see source details</p>
                    <div className="h-[270px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={majorSectors}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                onClick={(data) => {
                                    if (data && data.activePayload && data.activePayload[0]) {
                                        setSelectedItem(data.activePayload[0].payload as FinancialItem);
                                    }
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--surface-border)" />
                                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}B`} />
                                <YAxis dataKey="category" type="category" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} width={130} />
                                <Tooltip
                                    cursor={{ fill: 'var(--surface)' }}
                                    contentStyle={{
                                        backgroundColor: 'var(--glass-bg)',
                                        borderColor: 'var(--surface-border)',
                                        borderRadius: '12px',
                                        color: 'white',
                                        backdropFilter: 'blur(8px)'
                                    }}
                                    formatter={(value: number, _name: string, props: { payload: FinancialItem }) => [
                                        `$${value} Billion${props.payload.year ? ` (${props.payload.year})` : ''}`,
                                        'Investment'
                                    ]}
                                />
                                <Bar dataKey="amountBillionUSD" radius={[0, 4, 4, 0]} barSize={26} style={{ cursor: 'pointer' }}>
                                    {majorSectors.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Source detail panel — appears when user clicks a bar */}
            {selectedItem && (
                <div
                    className="glass-panel p-4 flex items-start gap-4 border-l-4 animate-fade-in"
                    style={{ borderLeftColor: selectedItem.color }}
                >
                    <BookOpen size={20} className="mt-0.5 shrink-0" style={{ color: selectedItem.color }} />
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <h4 className="text-white font-semibold text-sm">{selectedItem.category}</h4>
                            <button onClick={() => setSelectedItem(null)} className="text-[var(--text-muted)] hover:text-white text-xs">✕ Close</button>
                        </div>
                        <p className="text-[var(--text-muted)] text-xs mt-1">
                            <span className="font-medium text-white">Source :</span> {selectedItem.source ?? 'Not specified'}
                        </p>
                        <div className="flex gap-4 mt-2 text-xs text-[var(--text-muted)]">
                            {selectedItem.year && <span>Year: <span className="text-white font-medium">{selectedItem.year}</span></span>}
                            {selectedItem.yoy_growth_pct !== null && selectedItem.yoy_growth_pct !== undefined && (
                                <span className={`flex items-center gap-1 font-semibold ${selectedItem.yoy_growth_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {selectedItem.yoy_growth_pct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                    {selectedItem.yoy_growth_pct >= 0 ? '+' : ''}{selectedItem.yoy_growth_pct}% YoY
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* New Financing Lines Table */}
            <div className="glass-panel p-6">
                <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                    <span className="w-1 h-6 rounded-full bg-emerald-400"></span>
                    New Financing Lines (2024-2025)
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--surface-border)] text-xs uppercase tracking-wider text-[var(--text-muted)]">
                                <th className="px-4 py-3 font-semibold bg-[var(--surface)] rounded-tl-lg">Program</th>
                                <th className="px-4 py-3 font-semibold bg-[var(--surface)]">Amount</th>
                                <th className="px-4 py-3 font-semibold bg-[var(--surface)]">YoY</th>
                                <th className="px-4 py-3 font-semibold bg-[var(--surface)]">Year</th>
                                <th className="px-4 py-3 font-semibold bg-[var(--surface)] rounded-tr-lg">Official Source</th>
                            </tr>
                        </thead>
                        <tbody>
                            {newFinancingLines.map((item, idx) => (
                                <tr
                                    key={item.id}
                                    className={`border-b border-[var(--surface-border)] hover:bg-[var(--surface)] transition-colors ${idx === newFinancingLines.length - 1 ? 'border-b-0' : ''}`}
                                >
                                    <td className="px-4 py-4 text-sm font-medium text-white flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                                        {item.category}
                                    </td>
                                    <td className="px-4 py-4 text-sm font-bold" style={{ color: item.color }}>
                                        ${item.amountBillionUSD >= 1
                                            ? `${item.amountBillionUSD.toFixed(1)}B`
                                            : `${(item.amountBillionUSD * 1000).toFixed(0)}M`}
                                    </td>
                                    <td className="px-4 py-4 text-sm">
                                        {item.yoy_growth_pct !== null && item.yoy_growth_pct !== undefined ? (
                                            <span className={`flex items-center gap-1 font-semibold text-xs ${item.yoy_growth_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {item.yoy_growth_pct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                {item.yoy_growth_pct >= 0 ? '+' : ''}{item.yoy_growth_pct}%
                                            </span>
                                        ) : (
                                            <span className="text-[var(--text-muted)] flex items-center gap-1"><Minus size={12} /> N/A</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-[var(--text-muted)]">{item.year ?? '—'}</td>
                                    <td className="px-4 py-4 text-xs text-[var(--text-muted)] max-w-[260px]">{item.source ?? 'Not cited'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer: Financing Partners + Opportunity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <Briefcase size={20} className="text-[var(--primary)]" />
                        Key Financing Partners
                    </h3>
                    <div className="space-y-3">
                        {[
                            { name: 'World Bank Group', detail: '$1.77B — FY2025 Portfolio', badge: 'Active' },
                            { name: 'African Development Bank (AfDB)', detail: 'Strategic energy support', badge: 'Active' },
                            { name: 'European Investment Bank (EIB)', detail: '€500M in 2024 (+56% YoY)', badge: 'Active' },
                            { name: 'KfW (Germany)', detail: '€130M Grid + €13.5M H2A (2024-2025)', badge: 'Active' },
                        ].map((partner, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-[var(--surface-border)] bg-[var(--bg-accent)]">
                                <div>
                                    <span className="text-white font-medium text-sm">{partner.name}</span>
                                    <p className="text-[var(--text-muted)] text-xs mt-0.5">{partner.detail}</p>
                                </div>
                                <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 ml-3">{partner.badge}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-panel p-6 border-l-4 border-l-[var(--primary)] text-center flex flex-col justify-center items-center">
                    <h3 className="text-xl font-bold text-white mb-4">Investment Opportunities</h3>
                    <p className="text-[var(--text-muted)] mb-4 text-sm leading-relaxed max-w-sm">
                        Morocco&apos;s new Green Hydrogen offer (MAD 319B pipeline) and the &quot;Offre Maroc&quot; allocating 1M hectares for investors are opening major FDI avenues for 2025-2030.
                    </p>
                    <div className="flex flex-col gap-2 text-xs text-[var(--text-muted)] text-left w-full max-w-xs">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                            ONEE: MAD 220B investment plan by 2030
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            MASEN: 6,000 MW clean capacity by 2030
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Target: 52%+ renewables share by 2030
                        </div>
                    </div>
                    <button className="mt-6 px-6 py-2 rounded-full border border-white/20 text-white hover:bg-white hover:text-black transition-colors font-medium text-sm">
                        Download Investor Guide
                    </button>
                </div>
            </div>
        </div>
    );
}
