"use client";

import { useState, useEffect } from "react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid
} from "recharts";
import { ArrowUpRight, ArrowDownRight, Activity, Zap } from "lucide-react";

export function DashboardOverview() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [kpis, setKpis] = useState < any[] > ([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [currentMix, setCurrentMix] = useState < any[] > ([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [targetMix, setTargetMix] = useState < any[] > ([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [growth, setGrowth] = useState < any[] > ([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [projects, setProjects] = useState < any[] > ([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [kpisRes, mixRes, growthRes, projectsRes] = await Promise.all([
                    fetch('http://localhost:8000/api/kpis'),
                    fetch('http://localhost:8000/api/generation-mix'),
                    fetch('http://localhost:8000/api/historical-growth'),
                    fetch('http://localhost:8000/api/projects')
                ]);

                if (kpisRes.ok && mixRes.ok && growthRes.ok && projectsRes.ok) {
                    setKpis(await kpisRes.json());
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const mixData = await mixRes.json();
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    setCurrentMix(mixData.filter((m: any) => m.type === 'current'));
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    setTargetMix(mixData.filter((m: any) => m.type === 'target'));
                    setGrowth(await growthRes.json());
                    setProjects(await projectsRes.json());
                }
            } catch (error) {
                console.error("Error fetching overview data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-[var(--surface-border)] border-t-[var(--primary)] animate-spin"></div>
                <div className="text-[var(--text-muted)] animate-pulse font-medium">Connecting to Data Intelligence...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">National Energy Overview</h1>
                    <p className="text-[var(--text-muted)]">Moroccan energy transition performance and key metrics</p>
                </div>
                <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--surface-border)] rounded-full px-4 py-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-sm font-medium text-emerald-400">Live Data Sync</span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {kpis.map((kpi, index) => (
                    <div key={index} className="glass-panel p-6 relative overflow-hidden group">
                        {/* Subtle glow effect on hover */}
                        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-gradient-to-br from-[var(--primary-glow)] to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">{kpi.label}</h3>
                            <div className="p-2 bg-[var(--bg-accent)] rounded-lg text-[var(--primary)]">
                                {index === 0 ? <Zap size={18} /> : index === 1 ? <Activity size={18} /> : <span className="font-bold font-serif">$</span>}
                            </div>
                        </div>

                        <div className="flex items-baseline gap-2">
                            <h2 className="text-3xl font-bold text-white tracking-tight">{kpi.value}</h2>
                            <span className={`flex items-center text-xs font-semibold ${kpi.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {kpi.trend === 'up' ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                                {kpi.subtext}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Mix Chart */}
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <span className="w-1 h-6 rounded-full bg-[var(--primary)]"></span>
                        Current Generation Mix (2023)
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={currentMix}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {currentMix.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--glass-bg)',
                                        borderColor: 'var(--surface-border)',
                                        borderRadius: '12px',
                                        color: 'white',
                                        backdropFilter: 'blur(8px)'
                                    }}
                                    itemStyle={{ color: 'white' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2030 Target Chart */}
                <div className="glass-panel p-6 relative overflow-hidden">
                    {/* Target background highlight */}
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-[var(--primary-glow)] to-transparent opacity-10 pointer-events-none"></div>

                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <span className="w-1 h-6 rounded-full bg-[var(--accent)]"></span>
                        Target Capacity Mix (2030)
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={targetMix}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {targetMix.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--glass-bg)',
                                        borderColor: 'var(--surface-border)',
                                        borderRadius: '12px',
                                        color: 'white',
                                        backdropFilter: 'blur(8px)'
                                    }}
                                    itemStyle={{ color: 'white' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Historical Growth Area Chart */}
            <div className="glass-panel p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <span className="w-1 h-6 rounded-full bg-[var(--secondary)]"></span>
                        Renewable vs Fossil Transition Trend
                    </h3>
                    <select className="bg-[var(--bg-accent)] text-xs text-[var(--text-muted)] border outline-none border-[var(--surface-border)] rounded-md px-3 py-1.5 cursor-pointer">
                        <option>All Time</option>
                        <option>Last 5 Years</option>
                    </select>
                </div>
                <div className="h-[350px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={growth}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorRenewables" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorFossil" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#475569" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#475569" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" vertical={false} />
                            <XAxis dataKey="year" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--glass-bg)',
                                    borderColor: 'var(--surface-border)',
                                    borderRadius: '12px',
                                    color: 'white',
                                    backdropFilter: 'blur(8px)'
                                }}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                            <Area type="monotone" dataKey="fossil" name="Fossil Fuels (%)" stroke="#475569" fillOpacity={1} fill="url(#colorFossil)" />
                            <Area type="monotone" dataKey="renewables" name="Renewables (%)" stroke="var(--primary)" fillOpacity={1} fill="url(#colorRenewables)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Key Projects Table */}
            <div className="glass-panel p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <span className="w-1 h-6 rounded-full bg-white"></span>
                    Flagship Energy Projects
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--surface-border)] text-xs uppercase tracking-wider text-[var(--text-muted)]">
                                <th className="px-4 py-4 font-semibold rounded-tl-lg bg-[var(--surface)]">Project Name</th>
                                <th className="px-4 py-4 font-semibold bg-[var(--surface)]">Type</th>
                                <th className="px-4 py-4 font-semibold bg-[var(--surface)]">Capacity</th>
                                <th className="px-4 py-4 font-semibold bg-[var(--surface)]">Location</th>
                                <th className="px-4 py-4 font-semibold rounded-tr-lg bg-[var(--surface)]">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map((project, idx) => (
                                <tr key={project.id} className={`border-b border-[var(--surface-border)] hover:bg-[var(--surface)] transition-colors ${idx === projects.length - 1 ? 'border-b-0' : ''}`}>
                                    <td className="px-4 py-4 text-sm font-medium text-white">{project.name}</td>
                                    <td className="px-4 py-4 text-sm text-[var(--text-muted)]">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                      ${project.type === 'Solar' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                project.type === 'Wind' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                    'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                                            {project.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-white font-medium">{project.capacity_mw} MW</td>
                                    <td className="px-4 py-4 text-sm text-[var(--text-muted)]">{project.location_name}</td>
                                    <td className="px-4 py-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full 
                        ${project.status === 'Operational' ? 'bg-emerald-500' :
                                                    project.status === 'Under Construction' ? 'bg-amber-500' :
                                                        'bg-slate-500'}`}></span>
                                            <span className="text-[var(--text-muted)]">{project.status}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
