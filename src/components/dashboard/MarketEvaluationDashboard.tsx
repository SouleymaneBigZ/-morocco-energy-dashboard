"use client";

import { useState, useEffect, useCallback } from "react";
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from "recharts";
import { TrendingDown, Activity, DollarSign, Target, CheckCircle2, CircleDashed, RefreshCw, Info } from "lucide-react";
import { useSync } from "@/context/SyncContext";

interface MarketDataItem {
    id: number;
    year: number;
    residential_price: number;
    industrial_price: number;
    turt_price: number | null;
    turd_price: number | null;
    tss_price: number | null;
    excedent_pointe_price: number | null;
    excedent_hors_pointe_price: number | null;
    renewables_percentage: number;
    fossil_percentage: number;
    solar_lcoe: number;
    wind_lcoe: number;
    fossil_lcoe: number;
}

interface ReformItem {
    id: number;
    reform_name: string;
    description: string;
    status: string;
    completion_percentage: number;
}

const SOURCES = {
    tariffs: "ANRE — Décision tarifaire 2025 (effective 01/03/2025 · anre.ma)",
    lcoe: "IRENA — Renewable Power Generation Costs 2024 · Wood Mackenzie MENA 2025",
    fossil: "ONEE — Coût de revient import fossile estimé (0.9 DH/kWh objectif 2030)",
    retail: "ONEE — Tarifs résidentiels & industriels Mars 2025",
};

export function MarketEvaluationDashboard() {
    const [marketData, setMarketData] = useState < MarketDataItem[] > ([]);
    const [reformsData, setReformsData] = useState < ReformItem[] > ([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState < Date | null > (null);
    const [activeTooltip, setActiveTooltip] = useState < string | null > (null);
    const { isLiveSyncEnabled } = useSync();

    const fetchData = useCallback(async () => {
        try {
            const [marketRes, reformsRes] = await Promise.all([
                fetch("http://127.0.0.1:8000/api/market-data"),
                fetch("http://127.0.0.1:8000/api/reforms")
            ]);
            if (marketRes.ok && reformsRes.ok) {
                setMarketData(await marketRes.json());
                setReformsData(await reformsRes.json());
                setLastUpdated(new Date());
            }
        } catch (error) {
            console.error("Failed to fetch backend data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        let interval: NodeJS.Timeout;
        if (isLiveSyncEnabled) {
            interval = setInterval(fetchData, 10000);
        }
        return () => clearInterval(interval);
    }, [isLiveSyncEnabled, fetchData]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
                <Activity className="animate-spin text-[var(--primary)]" size={48} />
                <p className="text-[var(--text-muted)] animate-pulse">Syncing market data from ANRE & ONEE...</p>
            </div>
        );
    }

    const latestData = marketData[0] || {} as MarketDataItem;

    // LCOE chart — USD/MWh
    const lcoeData = [
        { name: 'Solar PV', cost: latestData.solar_lcoe, color: '#F59E0B', label: 'MENA avg ~$37-43/MWh (IRENA 2024)' },
        { name: 'Onshore Wind', cost: latestData.wind_lcoe, color: '#10B981', label: 'Global avg $34/MWh (IRENA 2024)' },
        { name: 'Avg Fossil', cost: latestData.fossil_lcoe, color: '#475569', label: 'Est. import cost (ONEE 0.9 DH/kWh)' },
    ];

    const tariffCards = [
        { label: 'TURT (Transport)', value: latestData.turt_price, unit: 'DH/kWh', source: 'ANRE — 01/03/2025', color: 'text-blue-400', highlight: false },
        { label: 'TURD (Distribution MT)', value: latestData.turd_price, unit: 'DH/kWh', source: 'ANRE — 01/03/2025', color: 'text-indigo-400', highlight: false },
        { label: 'TSS (Services Système)', value: latestData.tss_price, unit: 'DH/kWh', source: 'ANRE — 01/03/2025', color: 'text-violet-400', highlight: false },
        { label: 'Excédent Renouv. (Pointe)', value: latestData.excedent_pointe_price, unit: 'DH/kWh', source: 'ANRE — Autoproduction', color: 'text-emerald-400', highlight: true },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Market Evaluation</h1>
                    <p className="text-[var(--text-muted)]">Electricity pricing, LCOE competitiveness, and structural reform tracking</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    {isLiveSyncEnabled && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            LIVE SYNC ACTIVE
                        </div>
                    )}
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--surface-border)] text-[var(--text-muted)] hover:text-white text-xs font-medium transition-colors"
                    >
                        <RefreshCw size={12} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Data quality banner */}
            {lastUpdated && (
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-2">
                    <RefreshCw size={11} />
                    Last updated: {lastUpdated.toLocaleTimeString()} · Data: {latestData.year} · Sources: ANRE, IRENA, ONEE, Wood Mackenzie
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* LCOE Analysis Chart */}
                <div className="glass-panel p-6">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <TrendingDown size={20} className="text-[var(--primary)]" />
                            Levelized Cost of Energy (LCOE)
                        </h3>
                        <span className="text-xs bg-[var(--bg-accent)] text-[var(--text-muted)] px-2 py-1 rounded-md">USD / MWh</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mb-4 flex items-center gap-1">
                        <Info size={11} />
                        Source: {SOURCES.lcoe}
                    </p>

                    <div className="h-[230px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={lcoeData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--surface-border)" />
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                                <Tooltip
                                    cursor={{ fill: 'var(--surface)' }}
                                    contentStyle={{ backgroundColor: 'var(--glass-bg)', borderColor: 'var(--surface-border)', borderRadius: '12px', color: 'white' }}
                                    formatter={(value: number, _: string, props: { payload: { label: string } }) => [
                                        `$${value} / MWh`,
                                        props.payload.label
                                    ]}
                                />
                                <Bar dataKey="cost" radius={[4, 4, 0, 0]} barSize={44}>
                                    {lcoeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* LCOE breakdown detail */}
                    <div className="mt-4 space-y-2">
                        {lcoeData.map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                                    {item.name}
                                </span>
                                <span className="text-white font-semibold">${item.cost}/MWh</span>
                            </div>
                        ))}
                    </div>

                    <p className="text-xs text-[var(--text-muted)] mt-4 leading-relaxed border-t border-[var(--surface-border)] pt-3">
                        Renewables are now <strong className="text-white">2-3× cheaper</strong> than fossil imports, driving Morocco&apos;s economic case for the 2030 transition.
                    </p>
                </div>

                {/* ANRE Tariffs Panel */}
                <div className="glass-panel p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <DollarSign size={120} />
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                        <span className="w-1 h-6 rounded-full bg-emerald-500"></span>
                        Tarification & Accès Réseau (ANRE)
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mb-5 flex items-center gap-1">
                        <Info size={11} />
                        {SOURCES.tariffs}
                    </p>

                    {/* Retail prices */}
                    <div className="space-y-3 mb-5">
                        {[
                            { label: 'Prix Résidentiel Moyen', value: latestData.residential_price, source: SOURCES.retail, bar: 65 },
                            { label: 'Prix Industriel Moyen', value: latestData.industrial_price, source: SOURCES.retail, bar: 52 },
                        ].map((item, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm mb-1.5">
                                    <span className="text-[var(--text-muted)]">{item.label} ({latestData.year})</span>
                                    <span className="text-white font-bold">{item.value?.toFixed(2)} DH/kWh</span>
                                </div>
                                <div className="w-full bg-[var(--surface)] rounded-full h-1.5">
                                    <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: `${item.bar}%` }}></div>
                                </div>
                                <p className="text-xs text-[var(--text-muted)] mt-0.5">{item.source}</p>
                            </div>
                        ))}
                    </div>

                    {/* ANRE network tariffs grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {tariffCards.map((card, i) => (
                            <div
                                key={i}
                                className={`rounded-xl p-3 border cursor-pointer transition-all ${card.highlight ? 'bg-emerald-500/5 border-emerald-500/25' : 'bg-[var(--surface)] border-[var(--surface-border)]'} ${activeTooltip === card.label ? 'ring-1 ring-white/20' : ''}`}
                                onClick={() => setActiveTooltip(activeTooltip === card.label ? null : card.label)}
                            >
                                <p className={`text-xs mb-1 ${card.highlight ? 'text-emerald-400' : 'text-[var(--text-muted)]'}`}>{card.label}</p>
                                <p className={`text-sm font-bold ${card.color}`}>{card.value?.toFixed(4)} <span className="text-xs font-normal text-[var(--text-muted)]">{card.unit}</span></p>
                                {activeTooltip === card.label && (
                                    <p className="text-xs text-[var(--text-muted)] mt-1.5 border-t border-white/10 pt-1.5">{card.source}</p>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                        <p className="text-xs text-orange-400 leading-relaxed">
                            <strong>Objectif ANRE :</strong> Réduire le coût global de <strong>0.9 → 0.6 DH/kWh</strong> sur 20 ans via la libéralisation et l&apos;annulation des contrats fossiles. La <strong>Loi 82-21</strong> permet l&apos;autoproduction industrielle hors réseau.
                        </p>
                    </div>
                </div>
            </div>

            {/* Reform Tracker */}
            <div className="glass-panel p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Target size={20} className="text-blue-400" />
                        ANRE & Market Structural Reforms Tracker
                    </h3>
                    <span className="text-xs text-[var(--text-muted)]">Source: MEM / ANRE — Bulletins officiels 2023-2025</span>
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

            {/* Sources methodology footer */}
            <div className="glass-panel p-5 border-t-0">
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Info size={14} className="text-[var(--primary)]" />
                    Sources & Méthodologie
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                        { label: 'Tarifs réseau (TURT/TURD/TSS)', value: 'ANRE · Publication officielle 2025 (anre.ma) — Valide 01/03/2025 → 28/02/2027' },
                        { label: 'LCOE Solar & Wind', value: 'IRENA «Renewable Power Costs 2024» · Wood Mackenzie MENA Outlook 2025' },
                        { label: 'LCOE Fossile', value: 'Estimation basée objectif ONEE 0.9 DH/kWh (~$92/MWh au taux de change 2025)' },
                        { label: 'Prix retail résidentiel/industriel', value: 'ONEE — Grille tarifaire Mars 2025 · GlobalPetrolPrices.com (validation)' },
                        { label: 'Réformes de marché', value: 'MEM / ANRE — Bulletins réglementaires officiels 2023-2025' },
                        { label: 'Mix renouvelables 45.3%', value: 'ONEE / MEM — Bilan électrique 2024 (source: masen.ma, saurenergy.me)' },
                    ].map((s, i) => (
                        <div key={i} className="text-xs text-[var(--text-muted)]">
                            <span className="text-white font-medium">{s.label} :</span> {s.value}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
