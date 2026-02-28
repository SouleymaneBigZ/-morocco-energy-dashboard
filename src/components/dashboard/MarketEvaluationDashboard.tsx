"use client";

import { useState, useEffect } from "react";
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from "recharts";
import { TrendingDown, Activity, DollarSign, Target, CheckCircle2, CircleDashed } from "lucide-react";

export function MarketEvaluationDashboard() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [marketData, setMarketData] = useState < any[] > ([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [reformsData, setReformsData] = useState < any[] > ([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fetch dynamic real data from the Python FastAPI Backend
        const fetchData = async () => {
            try {
                // In a production app, this URL would be an environment variable
                const [marketRes, reformsRes] = await Promise.all([
                    fetch("http://127.0.0.1:8000/api/market-data"),
                    fetch("http://127.0.0.1:8000/api/reforms")
                ]);

                if (marketRes.ok && reformsRes.ok) {
                    const market = await marketRes.json();
                    const reforms = await reformsRes.json();
                    setMarketData(market);
                    setReformsData(reforms);
                }
            } catch (error) {
                console.error("Failed to fetch backend data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
                <Activity className="animate-spin text-[var(--primary)]" size={48} />
                <p className="text-[var(--text-muted)] animate-pulse">Syncing real-time market data from ANRE & ONEE...</p>
            </div>
        );
    }

    // Prepare LCOE comparison chart data
    const latestData = marketData[0] || {};
    const lcoeData = [
        { name: 'Solar PV', cost: latestData.solar_lcoe, color: 'var(--primary)' },
        { name: 'Onshore Wind', cost: latestData.wind_lcoe, color: 'var(--secondary)' },
        { name: 'Average Fossil', cost: latestData.fossil_lcoe, color: '#475569' },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Market Evaluation</h1>
                    <p className="text-[var(--text-muted)]">Real-time tracking of electricity prices, LCOE competitiveness, and structural reforms</p>
                </div>
                <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--surface-border)] rounded-full px-4 py-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-sm font-medium text-emerald-400">Live API Connected</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* LCOE Analysis Chart */}
                <div className="glass-panel p-6">
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <TrendingDown size={20} className="text-[var(--primary)]" />
                            Levelized Cost of Energy (LCOE)
                        </h3>
                        <span className="text-xs bg-[var(--bg-accent)] text-[var(--text-muted)] px-2 py-1 rounded-md">USD/MWh</span>
                    </div>

                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={lcoeData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--surface-border)" />
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                <Tooltip
                                    cursor={{ fill: 'var(--surface)' }}
                                    contentStyle={{
                                        backgroundColor: 'var(--glass-bg)',
                                        borderColor: 'var(--surface-border)',
                                        borderRadius: '12px',
                                        color: 'white'
                                    }}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    formatter={(value: any) => [`$${value} / MWh`, 'LCOE']}
                                />
                                <Bar dataKey="cost" radius={[4, 4, 0, 0]} barSize={40}>
                                    {lcoeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-4">
                        Renewable energy sources in Morocco are now significantly cheaper than imported fossil fuels, driving the economic rationale for the 2030 transition.
                    </p>
                </div>

                {/* Retail Price Snapshot */}
                <div className="glass-panel p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <DollarSign size={120} />
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <span className="w-1 h-6 rounded-full bg-emerald-500"></span>
                        Electricity End-User Prices (2024/2025)
                    </h3>

                    <div className="space-y-6 mt-8">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-[var(--text-muted)]">Residential Average</span>
                                <span className="text-white font-bold">{latestData.residential_price} MAD / kWh</span>
                            </div>
                            <div className="w-full bg-[var(--surface)] rounded-full h-2">
                                <div className="bg-blue-400 h-2 rounded-full" style={{ width: '60%' }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-[var(--text-muted)]">Industrial Average</span>
                                <span className="text-white font-bold">{latestData.industrial_price} MAD / kWh</span>
                            </div>
                            <div className="w-full bg-[var(--surface)] rounded-full h-2">
                                <div className="bg-amber-400 h-2 rounded-full" style={{ width: '55%' }}></div>
                            </div>
                        </div>

                        <div className="mt-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                            <p className="text-xs text-orange-400 leading-relaxed">
                                Note: Prices reflect recent subsidy adjustments. The new <b>Law 82-21</b> on self-generation allows industries to bypass grid costs by generating their own solar energy (up to 5MW easily), creating a massive market opportunity.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reform Tracker Section */}
            <div className="glass-panel p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Target size={20} className="text-blue-400" />
                        ANRE & Market Structural Reforms Tracker
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reformsData.map((reform, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-[var(--surface-border)] bg-[var(--bg-accent)] flex flex-col justify-between hover:border-[var(--primary)] transition-colors">
                            <div>
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className="text-sm font-bold text-white pr-4">{reform.reform_name}</h4>
                                    {reform.status === "Complete" ? (
                                        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                                    ) : (
                                        <CircleDashed size={18} className="text-amber-500 shrink-0" />
                                    )}
                                </div>
                                <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">
                                    {reform.description}
                                </p>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className={reform.status === "Complete" ? "text-emerald-500 font-medium" : "text-amber-500 font-medium"}>
                                        {reform.status}
                                    </span>
                                    <span className="text-[var(--text-muted)]">{reform.completion_percentage}%</span>
                                </div>
                                <div className="w-full bg-[#0F172A] rounded-full h-1.5">
                                    <div
                                        className={`h-1.5 rounded-full ${reform.status === "Complete" ? "bg-emerald-500" : "bg-amber-500"}`}
                                        style={{ width: `${reform.completion_percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}

