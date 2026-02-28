"use client";

import { useState, useEffect } from "react";
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
import { TrendingUp, DollarSign, Briefcase } from "lucide-react";
import { useSync } from "@/context/SyncContext";

export function FinancialsDashboard() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [investmentDistribution, setInvestmentDistribution] = useState < any[] > ([]);
    const [isLoading, setIsLoading] = useState(true);
    const { isLiveSyncEnabled } = useSync();

    useEffect(() => {
        const fetchFinancials = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/financials');
                if (response.ok) {
                    setInvestmentDistribution(await response.json());
                }
            } catch (error) {
                console.error("Error fetching financials data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFinancials();

        let interval: NodeJS.Timeout;
        if (isLiveSyncEnabled) {
            interval = setInterval(fetchFinancials, 10000);
        }
        return () => clearInterval(interval);
    }, [isLiveSyncEnabled]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalInvestment = investmentDistribution.reduce((sum: number, item: any) => sum + item.amountBillionUSD, 0);

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
                    <p className="text-[var(--text-muted)]">Investment distribution and financing across the energy sector</p>
                </div>
                <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--surface-border)] rounded-full px-4 py-2">
                    <span className="text-sm font-medium text-[var(--text-muted)]">Values in USD (Billions)</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Total Investment Summary Card */}
                <div className="md:col-span-1 glass-panel p-6 flex flex-col justify-center relative overflow-hidden">
                    {/* Glow */}
                    <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-[var(--secondary)] rounded-full blur-3xl opacity-20 pointer-events-none"></div>

                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400">
                            <DollarSign size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-white">Total Active Investment</h3>
                    </div>

                    <div className="mt-4">
                        <span className="text-5xl font-bold text-white tracking-tighter">${totalInvestment.toFixed(1)}</span>
                        <span className="text-xl text-[var(--text-muted)] ml-2">Billion</span>
                    </div>

                    <div className="mt-6 flex items-center gap-2 text-sm text-emerald-400">
                        <TrendingUp size={16} />
                        <span>+12% projected YoY growth</span>
                    </div>
                </div>

                {/* Investment Distribution Chart */}
                <div className="md:col-span-2 glass-panel p-6">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <span className="w-1 h-6 rounded-full bg-[var(--secondary)]"></span>
                        Capital Allocation by Sector
                    </h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={investmentDistribution}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--surface-border)" />
                                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}B`} />
                                <YAxis dataKey="category" type="category" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} width={120} />
                                <Tooltip
                                    cursor={{ fill: 'var(--surface)' }}
                                    contentStyle={{
                                        backgroundColor: 'var(--glass-bg)',
                                        borderColor: 'var(--surface-border)',
                                        borderRadius: '12px',
                                        color: 'white',
                                        backdropFilter: 'blur(8px)'
                                    }}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    formatter={(value: any) => [`$${value} Billion`, 'Investment']}
                                />
                                <Bar dataKey="amountBillionUSD" radius={[0, 4, 4, 0]} barSize={24}>
                                    {investmentDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Financing Partners Strategy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <Briefcase size={20} className="text-[var(--primary)]" />
                        Key Financing Partners
                    </h3>
                    <div className="space-y-4">
                        {['World Bank Group', 'African Development Bank (AfDB)', 'European Investment Bank (EIB)', 'Kfw (Germany)'].map((partner, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-[var(--surface-border)] bg-[var(--bg-accent)]">
                                <span className="text-white font-medium">{partner}</span>
                                <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-panel p-6 border-l-4 border-l-[var(--primary)] text-center flex flex-col justify-center items-center">
                    <h3 className="text-xl font-bold text-white mb-4">Investment Opportunities</h3>
                    <p className="text-[var(--text-muted)] mb-6 text-sm leading-relaxed max-w-sm">
                        Morocco&apos;s new Green Hydrogen offer and the expansion of the legal framework for self-production are opening new avenues for foreign direct investment (FDI) in 2024-2030.
                    </p>
                    <button className="px-6 py-2 rounded-full border border-white/20 text-white hover:bg-white hover:text-black transition-colors font-medium text-sm">
                        Download Investor Guide
                    </button>
                </div>
            </div>
        </div>
    );
}
