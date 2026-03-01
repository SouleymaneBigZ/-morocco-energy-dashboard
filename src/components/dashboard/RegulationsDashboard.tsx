"use client";

import { useState, useEffect } from "react";
import { Scale, FileText, CheckCircle2, ChevronRight, BookOpen } from "lucide-react";
import { useSync } from "@/context/SyncContext";

export function RegulationsDashboard() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [regulatoryUpdates, setRegulatoryUpdates] = useState < any[] > ([]);
    const [isLoading, setIsLoading] = useState(true);
    const { isLiveSyncEnabled } = useSync();

    useEffect(() => {
        const fetchRegulations = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/regulations');
                if (response.ok) {
                    setRegulatoryUpdates(await response.json());
                }
            } catch (error) {
                console.error("Error fetching regulations data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRegulations();

        let interval: NodeJS.Timeout;
        if (isLiveSyncEnabled) {
            interval = setInterval(fetchRegulations, 10000);
        }
        return () => clearInterval(interval);
    }, [isLiveSyncEnabled]);

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
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Regulatory Framework</h1>
                    <p className="text-[var(--text-muted)] text-sm max-w-2xl">Key laws, decrees, and policies driving the Moroccan energy transition and grid liberalization.</p>
                </div>
                <div className="flex items-center gap-3 bg-[#0A1225]/80 backdrop-blur-md border border-white/10 rounded-full px-5 py-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                    <div className="p-1.5 bg-blue-500/20 rounded-full">
                        <Scale size={16} className="text-blue-400" />
                    </div>
                    <span className="text-sm font-semibold text-white/90">Legal Observatory</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Timeline of Regulations */}
                <div className="lg:col-span-2 relative flex flex-col group">
                    {/* Ambient Glow */}
                    <div className="absolute -inset-1 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>

                    <div className="glass-panel p-8 rounded-[2rem] relative bg-[var(--surface)]/60 backdrop-blur-xl border border-white/5 shadow-2xl h-full">
                        <h3 className="text-xl font-semibold text-white mb-10 flex items-center gap-3">
                            <span className="w-1.5 h-8 rounded-full bg-gradient-to-b from-blue-400 to-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.6)]"></span>
                            Recent Updates & Policies
                        </h3>

                        <div className="relative border-l-2 border-white/10 ml-4 space-y-10 pb-4">
                            {regulatoryUpdates.map((update, index) => (
                                <div key={update.id} className="relative pl-10 group/item">
                                    {/* Animated Timeline Dot */}
                                    <span className={`absolute -left-[11px] top-1.5 w-5 h-5 rounded-full border-[4px] border-[#0A1225] shadow-[0_0_10px_rgba(0,0,0,0.8)] z-10 transition-transform duration-300 group-hover/item:scale-125
                      ${update.type === 'Law' ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]' :
                                            update.type === 'Policy' ? 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)]' :
                                                'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.8)]'}`}
                                    ></span>

                                    {/* Content Card */}
                                    <div className="bg-[#0A1225]/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:border-white/20 hover:bg-[#0A1225]/60 transition-all duration-500 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:-translate-y-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="text-[11px] font-bold text-white/60 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 uppercase tracking-wider">
                                                {update.date}
                                            </span>
                                            <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full border uppercase tracking-widest
                          ${update.type === 'Law' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                                                    update.type === 'Policy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                                                        'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}
                                            >
                                                {update.type}
                                            </span>
                                        </div>

                                        <h4 className="text-xl font-bold text-white mt-2 mb-3 leading-snug">{update.title}</h4>
                                        <p className="text-sm text-white/60 leading-relaxed font-light">
                                            {update.description}
                                        </p>

                                        <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between">
                                            <button className="text-xs text-blue-400 font-semibold flex items-center gap-1.5 hover:text-blue-300 transition-colors group/btn">
                                                <FileText size={14} className="group-hover/btn:scale-110 transition-transform" />
                                                <span>Read Full Text</span>
                                            </button>
                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center translate-x-4 opacity-0 group-hover/item:translate-x-0 group-hover/item:opacity-100 transition-all duration-300">
                                                <ChevronRight size={16} className="text-white/60" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Key Legislative Pillars */}
                <div className="space-y-6">
                    <div className="glass-panel p-8 rounded-[2rem] bg-gradient-to-b from-[#0A1225] to-[#040810] border border-white/5 shadow-2xl relative overflow-hidden">
                        {/* Decorative Background Blur */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full"></div>

                        <div className="flex items-center gap-3 mb-8 relative z-10">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                                <BookOpen size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-white tracking-wide">Core Pillars</h3>
                        </div>

                        <ul className="space-y-6 relative z-10">
                            <li className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                <div className="p-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mt-0.5 shrink-0">
                                    <CheckCircle2 size={16} className="text-emerald-400" />
                                </div>
                                <div>
                                    <h5 className="text-[15px] font-bold text-white/90">Law 48-15 (ANRE)</h5>
                                    <p className="text-xs text-white/50 mt-1.5 leading-relaxed font-light">Established the National Electricity Regulatory Authority to regulate free market access.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                <div className="p-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mt-0.5 shrink-0">
                                    <CheckCircle2 size={16} className="text-emerald-400" />
                                </div>
                                <div>
                                    <h5 className="text-[15px] font-bold text-white/90">Law 13-09 & 40-19</h5>
                                    <p className="text-xs text-white/50 mt-1.5 leading-relaxed font-light">Foundation for RE development opening the HT/THT grid to the private sector.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                <div className="p-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mt-0.5 shrink-0">
                                    <CheckCircle2 size={16} className="text-emerald-400" />
                                </div>
                                <div>
                                    <h5 className="text-[15px] font-bold text-white/90">Law 82-21</h5>
                                    <p className="text-xs text-white/50 mt-1.5 leading-relaxed font-light">Right to self-produce electricity and sell excess to the grid at regulated rates.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                <div className="p-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mt-0.5 shrink-0">
                                    <CheckCircle2 size={16} className="text-emerald-400" />
                                </div>
                                <div>
                                    <h5 className="text-[15px] font-bold text-white/90">Green Hydrogen Strategy</h5>
                                    <p className="text-xs text-white/50 mt-1.5 leading-relaxed font-light">Positioning Morocco as a global hub for PtX (Power-to-X) investments.</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Premium Outlook Card */}
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/30 to-orange-600/30 rounded-[1.5rem] blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
                        <div className="glass-panel p-6 rounded-[1.5rem] relative bg-[#13110E] border border-amber-500/20">
                            <h4 className="text-amber-400 font-bold mb-3 flex items-center gap-2.5 tracking-wide">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></span>
                                </span>
                                Regulatory Outlook
                            </h4>
                            <p className="text-sm text-white/70 leading-relaxed font-light">
                                Upcoming debates regarding the liberalization of the low-voltage network and the establishment of a fully independent national grid operator (ISO).
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
