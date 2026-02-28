"use client";

import { useState, useEffect } from "react";
import { Scale, FileText, CheckCircle2, ChevronRight, BookOpen } from "lucide-react";

export function RegulationsDashboard() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [regulatoryUpdates, setRegulatoryUpdates] = useState < any[] > ([]);
    const [isLoading, setIsLoading] = useState(true);

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
    }, []);

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
                    <h1 className="text-3xl font-bold text-white mb-1">Regulatory Framework</h1>
                    <p className="text-[var(--text-muted)]">Key laws, decrees, and policies driving the energy transition</p>
                </div>
                <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--surface-border)] rounded-full px-4 py-2">
                    <Scale size={16} className="text-blue-400" />
                    <span className="text-sm font-medium text-[var(--text-muted)]">Legal Observatory</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Timeline of Regulations */}
                <div className="lg:col-span-2 glass-panel p-6">
                    <h3 className="text-lg font-semibold text-white mb-8 flex items-center gap-2">
                        <span className="w-1 h-6 rounded-full bg-blue-500"></span>
                        Recent Updates & Policies
                    </h3>

                    <div className="relative border-l border-[var(--surface-border)] ml-3 space-y-8">
                        {regulatoryUpdates.map((update) => (
                            <div key={update.id} className="relative pl-8 group">
                                {/* Timeline Dot */}
                                <span className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-[var(--glass-bg)]
                  ${update.type === 'Law' ? 'bg-blue-500' :
                                        update.type === 'Policy' ? 'bg-emerald-500' :
                                            'bg-amber-500'}`}
                                ></span>

                                {/* Content Card */}
                                <div className="bg-[var(--surface)] border border-[var(--surface-border)] rounded-xl p-5 hover:border-[var(--primary)] transition-colors duration-300">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-bold text-[var(--text-muted)] bg-[var(--bg-accent)] px-2 py-1 rounded-md">
                                            {update.date}
                                        </span>
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border
                      ${update.type === 'Law' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                update.type === 'Policy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                    'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}
                                        >
                                            {update.type}
                                        </span>
                                    </div>

                                    <h4 className="text-lg font-bold text-white mt-1 mb-2">{update.title}</h4>
                                    <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                                        {update.description}
                                    </p>

                                    <div className="mt-4 pt-4 border-t border-[var(--surface-border)] flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="text-xs text-[var(--primary)] font-medium flex items-center gap-1 hover:underline">
                                            <FileText size={14} /> Read Full Text
                                        </button>
                                        <ChevronRight size={16} className="text-[var(--text-muted)]" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Key Legislative Pillars */}
                <div className="space-y-6">
                    <div className="glass-panel p-6 bg-gradient-to-br from-[var(--surface)] to-blue-900/10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                                <BookOpen size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-white">Core Pillars</h3>
                        </div>

                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                                <div>
                                    <h5 className="text-sm font-semibold text-white">Law 13-09</h5>
                                    <p className="text-xs text-[var(--text-muted)] mt-1">Foundation for RE development and private production.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                                <div>
                                    <h5 className="text-sm font-semibold text-white">Law 82-21</h5>
                                    <p className="text-xs text-[var(--text-muted)] mt-1">Right to self-produce electricity and sell excess to the grid.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                                <div>
                                    <h5 className="text-sm font-semibold text-white">Green Hydrogen Strategy</h5>
                                    <p className="text-xs text-[var(--text-muted)] mt-1">Positioning Morocco as a global hub for PtX (Power-to-X).</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div className="glass-panel p-6 border border-amber-500/20 bg-amber-500/5">
                        <h4 className="text-amber-400 font-semibold mb-2 flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                            </span>
                            Regulatory Outlook
                        </h4>
                        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                            Upcoming debates regarding the liberalization of the low-voltage network and the establishment of a fully independent national grid operator (ANRE directives).
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
