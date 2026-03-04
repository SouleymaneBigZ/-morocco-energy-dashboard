"use client";

import { useState, useEffect, useCallback } from "react";
import { MapPin, Info, Zap, Wind, Droplets, Activity, Leaf, AlertTriangle, Droplet } from "lucide-react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useSync } from "@/context/SyncContext";

const geoUrl = "/world.json";

export function ProjectsMap() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [keyProjects, setKeyProjects] = useState < any[] > ([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedProject, setSelectedProject] = useState < any | null > (null);
    const [isLoading, setIsLoading] = useState(true);

    // Map Layers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [gridLines, setGridLines] = useState < any[] > ([]);
    const [showGrid, setShowGrid] = useState(false);

    // SIBE Layer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [sibeZones, setSibeZones] = useState < any | null > (null);
    const [showSibe, setShowSibe] = useState(false);

    // Water Stress Layer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [waterStressScores, setWaterStressScores] = useState < Record < number, any>> ({});
    const [showWaterStress, setShowWaterStress] = useState(false);
    const [isFetchingWaterStress, setIsFetchingWaterStress] = useState(false);

    const { isLiveSyncEnabled } = useSync();

    // Climate Data state
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [climateData, setClimateData] = useState < any | null > (null);
    const [isClimateLoading, setIsClimateLoading] = useState(false);
    const [activeClimateTab, setActiveClimateTab] = useState < 'GHI' | 'DNI' | 'Wind' > ('GHI');

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/projects');
                if (response.ok) {
                    const data = await response.json();
                    setKeyProjects(data);
                    if (data.length > 0) {
                        setSelectedProject(data[0]);
                    }
                }
            } catch (error) {
                console.error("Error fetching projects data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        const fetchGridData = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/grid-data');
                if (res.ok) {
                    const gridFeatureCollection = await res.json();
                    setGridLines(gridFeatureCollection.features || []);
                }
            } catch (error) {
                console.error("Error fetching grid data:", error);
            }
        };

        const fetchSibeZones = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/sibe-zones');
                if (res.ok) {
                    const data = await res.json();
                    setSibeZones(data);
                }
            } catch (error) {
                console.error("Error fetching SIBE zones:", error);
            }
        };

        fetchProjects();
        fetchGridData();
        fetchSibeZones();

        let interval: NodeJS.Timeout;
        if (isLiveSyncEnabled) {
            interval = setInterval(fetchProjects, 300000);
        }
        return () => clearInterval(interval);
    }, [isLiveSyncEnabled]);

    // Fetch dynamic climatic data whenever a project is selected
    useEffect(() => {
        if (!selectedProject || !selectedProject.latitude || !selectedProject.longitude) return;

        const fetchClimateData = async () => {
            setIsClimateLoading(true);
            setClimateData(null);
            try {
                const res = await fetch(`http://localhost:8000/api/climate-data?lat=${selectedProject.latitude}&lon=${selectedProject.longitude}`);
                if (res.ok) {
                    const data = await res.json();
                    setClimateData(data);
                }
            } catch (err) {
                console.error("Failed to fetch climate data:", err);
            } finally {
                setIsClimateLoading(false);
            }
        };

        // Also fetch individual water stress if we don't have it globally
        const fetchSingleWaterStress = async () => {
            if (!waterStressScores[selectedProject.id]) {
                try {
                    const res = await fetch(`http://localhost:8000/api/water-stress?lat=${selectedProject.latitude}&lon=${selectedProject.longitude}`);
                    if (res.ok) {
                        const data = await res.json();
                        setWaterStressScores(prev => ({ ...prev, [selectedProject.id]: data }));
                    }
                } catch (err) {
                    console.error("Failed to fetch specific water stress:", err);
                }
            }
        };

        fetchClimateData();
        fetchSingleWaterStress();
    }, [selectedProject]);

    // Fetch all water stress scores if layer is activated
    useEffect(() => {
        if (showWaterStress && Object.keys(waterStressScores).length < keyProjects.length) {
            setIsFetchingWaterStress(true);
            Promise.all(keyProjects.map(p =>
                fetch(`http://localhost:8000/api/water-stress?lat=${p.latitude}&lon=${p.longitude}`)
                    .then(res => res.json())
                    .then(data => ({ id: p.id, data }))
                    .catch(() => ({ id: p.id, data: null }))
            )).then(results => {
                const scores: Record<number, any> = { ...waterStressScores };
                results.forEach(r => {
                    if (r.data) scores[r.id] = r.data;
                });
                setWaterStressScores(scores);
                setIsFetchingWaterStress(false);
            });
        }
    }, [showWaterStress, keyProjects]);

    const getIcon = (type: string) => {
        switch (type) {
            case "Solar": return <Zap className="text-amber-500" size={16} />;
            case "Wind": return <Wind className="text-emerald-500" size={16} />;
            case "Hydro": return <Droplets className="text-blue-500" size={16} />;
            default: return <MapPin />;
        }
    };

    const getLineColor = (legend: string) => {
        if (!legend) return "rgba(100, 116, 139, 0.5)";
        if (legend.includes("400")) return "rgba(239, 68, 68, 0.7)";
        if (legend.includes("225")) return "rgba(245, 158, 11, 0.7)";
        if (legend.includes("60")) return "rgba(59, 130, 246, 0.6)";
        return "rgba(100, 116, 139, 0.5)";
    };

    // Calculate rough distance to nearest SIBE
    const getNearestSibe = useCallback((lat: number, lon: number) => {
        if (!sibeZones || !sibeZones.features) return null;
        let minDist = Infinity;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let nearestSibe: any = null;

        const R = 6371; // Earth radius in km
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sibeZones.features.forEach((feature: any) => {
            if (feature.geometry.type === 'Polygon' && feature.geometry.coordinates[0].length > 0) {
                const coords = feature.geometry.coordinates[0][0]; // Check first vertex as rough proxy
                const dLat = (coords[1] - lat) * Math.PI / 180;
                const dLon = (coords[0] - lon) * Math.PI / 180;
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(lat * Math.PI / 180) * Math.cos(coords[1] * Math.PI / 180) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const dist = R * c;

                if (dist < minDist) {
                    minDist = dist;
                    nearestSibe = feature.properties;
                }
            }
        });

        return { name: nearestSibe?.name, distance: minDist };
    }, [sibeZones]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Projects & Assets</h1>
                    <p className="text-[var(--text-muted)]">Interactive map of renewable energy installations and environmental constraints</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        onClick={() => setShowSibe(!showSibe)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border ${showSibe
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                            : "bg-[var(--surface)] text-[var(--text-muted)] border-[var(--surface-border)] hover:bg-[var(--surface-hover)]"
                            }`}
                    >
                        <Leaf size={14} />
                        SIBE Zones
                    </button>

                    <button
                        onClick={() => setShowWaterStress(!showWaterStress)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border ${showWaterStress
                            ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                            : "bg-[var(--surface)] text-[var(--text-muted)] border-[var(--surface-border)] hover:bg-[var(--surface-hover)]"
                            }`}
                    >
                        {isFetchingWaterStress ? <Activity size={14} className="animate-spin" /> : <Droplet size={14} />}
                        Water Stress
                    </button>

                    <button
                        onClick={() => setShowGrid(!showGrid)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border ${showGrid
                            ? "bg-blue-500/20 text-blue-400 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                            : "bg-[var(--surface)] text-[var(--text-muted)] border-[var(--surface-border)] hover:bg-[var(--surface-hover)]"
                            }`}
                    >
                        <Activity size={14} className={showGrid ? "animate-pulse" : ""} />
                        Power Grid
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center min-h-[400px] w-full">
                    <div className="w-10 h-10 border-4 border-[var(--surface-border)] border-t-[var(--primary)] rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Map Visualization Area */}
                    <div className="lg:col-span-2 relative flex flex-col group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-transparent to-emerald-500/20 rounded-[2rem] blur-xl opacity-30 group-hover:opacity-70 transition duration-1000"></div>

                        <div className="glass-panel p-2 rounded-[2rem] min-h-[500px] relative flex flex-col overflow-hidden bg-[var(--surface)]/60 backdrop-blur-md border border-white/10 shadow-2xl">

                            <div className="relative w-full h-[700px] lg:h-[800px] z-10 rounded-[1.5rem] bg-gradient-to-b from-[#0A1225] to-[#040810] shadow-[inset_0_4px_40px_rgba(0,0,0,0.8)] overflow-hidden flex items-center justify-center border border-white/5">

                                <div className="absolute top-6 left-6 z-20 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)] backdrop-blur-md">
                                        <MapPin size={20} className="text-blue-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-0.5">Interactive Explorer</h3>
                                        <h2 className="text-xl text-white font-medium tracking-wide">Geographical Distribution</h2>
                                    </div>
                                </div>

                                <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-screen" style={{
                                    backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                                    backgroundSize: "40px 40px"
                                }}></div>
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.06)_0%,transparent_70%)] pointer-events-none"></div>

                                <ComposableMap
                                    projection="geoMercator"
                                    projectionConfig={{
                                        scale: 2200,
                                        center: [-8, 29.5]
                                    }}
                                    className="w-full h-full outline-none"
                                >
                                    <ZoomableGroup zoom={1} center={[-8, 29.5]} minZoom={1} maxZoom={5}>
                                        <Geographies geography={geoUrl}>
                                            {({ geographies }) =>
                                                geographies.map((geo) => {
                                                    const isMorocco = geo.properties.name === "Morocco" || geo.id === "MAR" || geo.id === "ESH";
                                                    return (
                                                        <Geography
                                                            key={geo.rsmKey}
                                                            geography={geo}
                                                            fill={isMorocco ? "var(--surface)" : "#070E1B"}
                                                            stroke="var(--surface-border)"
                                                            strokeWidth={isMorocco ? 1.5 : 0.5}
                                                            className="outline-none"
                                                            style={{
                                                                default: { outline: "none" },
                                                                hover: { outline: "none", fill: isMorocco ? "rgba(30, 41, 59, 0.8)" : "#070E1B" },
                                                                pressed: { outline: "none" },
                                                            }}
                                                        />
                                                    );
                                                })
                                            }
                                        </Geographies>

                                        {/* SIBE Zones Layer */}
                                        {showSibe && sibeZones && (
                                            <Geographies geography={sibeZones}>
                                                {({ geographies }) =>
                                                    geographies.map((geo, i) => (
                                                        <Geography
                                                            key={`sibe-poly-${i}`}
                                                            geography={geo}
                                                            fill="rgba(16, 185, 129, 0.25)"
                                                            stroke="rgba(16, 185, 129, 0.8)"
                                                            strokeWidth={1}
                                                            className="outline-none transition-all duration-300 hover:fill-emerald-500/40"
                                                            style={{
                                                                default: { outline: "none" },
                                                                hover: { outline: "none" },
                                                                pressed: { outline: "none" },
                                                            }}
                                                        />
                                                    ))
                                                }
                                            </Geographies>
                                        )}

                                        {/* Power Grid Lines */}
                                        {showGrid && (
                                            <Geographies geography={{ type: "FeatureCollection", features: gridLines }}>
                                                {({ geographies }) =>
                                                    geographies.map((geo, i) => {
                                                        const color = getLineColor(geo.properties?.Legend);
                                                        return (
                                                            <Geography
                                                                key={`grid-line-${i}`}
                                                                geography={geo}
                                                                fill="transparent"
                                                                stroke={color}
                                                                strokeWidth={0.5}
                                                                className="opacity-70 transition-all duration-500"
                                                                style={{
                                                                    default: { outline: "none" },
                                                                    hover: { outline: "none", strokeWidth: 1.5, opacity: 1 },
                                                                    pressed: { outline: "none" },
                                                                }}
                                                            />
                                                        );
                                                    })
                                                }
                                            </Geographies>
                                        )}

                                        {/* Plotting Projects */}
                                        {keyProjects.map((project) => {
                                            const coordinates = [project.longitude, project.latitude];
                                            const isSelected = selectedProject && selectedProject.id === project.id;

                                            // Water Stress Marker Logic
                                            let waterColor = "var(--bg-primary)";
                                            if (showWaterStress && waterStressScores[project.id]) {
                                                const score = waterStressScores[project.id].bws_score;
                                                if (score >= 4) waterColor = "rgba(239, 68, 68, 0.9)"; // Red (Extreme)
                                                else if (score >= 3) waterColor = "rgba(245, 158, 11, 0.9)"; // Orange (High)
                                                else if (score >= 2) waterColor = "rgba(234, 179, 8, 0.9)"; // Yellow (Medium-High)
                                                else waterColor = "rgba(16, 185, 129, 0.9)"; // Green (Low)
                                            }

                                            return (
                                                <Marker key={project.id} coordinates={coordinates as [number, number]}>
                                                    <g
                                                        transform="translate(-16, -16)"
                                                        className="cursor-pointer transition-all duration-300 transform outline-none"
                                                        onClick={() => setSelectedProject(project)}
                                                        style={{ transformOrigin: "center" }}
                                                    >
                                                        <circle cx="16" cy="16" r="16" fill={waterColor} stroke={isSelected ? "white" : "var(--surface-border)"} strokeWidth={isSelected ? 2 : 1} className="transition-all duration-300 shadow-xl" />
                                                        <g transform="translate(8, 8)">
                                                            {showWaterStress ? <Droplet className="text-white drop-shadow-md" size={16} /> : getIcon(project.type)}
                                                        </g>

                                                        {isSelected && (
                                                            <circle cx="16" cy="16" r="24" fill="none" stroke="var(--primary)" strokeWidth="1" className="animate-ping opacity-50" />
                                                        )}

                                                        <text
                                                            textAnchor="start"
                                                            y="-8"
                                                            x="16"
                                                            style={{
                                                                fill: "white",
                                                                fontSize: "12px",
                                                                fontWeight: "bold",
                                                                opacity: isSelected ? 1 : 0,
                                                                filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.8))",
                                                                transition: "opacity 0.3s"
                                                            }}
                                                        >
                                                            {project.location_name}
                                                        </text>
                                                    </g>
                                                </Marker>
                                            );
                                        })}
                                    </ZoomableGroup>
                                </ComposableMap>

                                {/* Legend Context */}
                                <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-20 animate-fade-in pointer-events-none">
                                    {(showSibe || showWaterStress) && (
                                        <div className="bg-[#0A1225]/80 backdrop-blur-xl px-5 py-4 rounded-2xl flex flex-col gap-3 text-sm border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] mb-2">
                                            {showSibe && (
                                                <div className="flex flex-col gap-1.5 border-b border-white/10 pb-2 mb-1">
                                                    <div className="font-semibold text-white/90 flex items-center gap-2 tracking-wide text-xs uppercase">
                                                        <Leaf size={14} className="text-emerald-400" /> Protected Areas
                                                    </div>
                                                    <div className="flex items-center gap-2 text-white/80 text-xs">
                                                        <div className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500/80"></div>
                                                        SIBE / National Parks
                                                    </div>
                                                </div>
                                            )}
                                            {showWaterStress && (
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="font-semibold text-white/90 flex items-center gap-2 tracking-wide text-xs uppercase mb-1">
                                                        <Droplet size={14} className="text-cyan-400" /> WRI Aqueduct Score
                                                    </div>
                                                    <div className="flex items-center gap-4 text-white/80 text-xs">
                                                        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> >4 (Ext)</div>
                                                        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> 3-4 (High)</div>
                                                        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span> 2-3 (Med)</div>
                                                        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> &lt;2 (Low)</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {!showGrid && !showWaterStress && (
                                        <div className="bg-[#0A1225]/80 backdrop-blur-xl px-5 py-3.5 rounded-2xl flex gap-6 text-sm border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                                            <div className="flex items-center gap-2.5 text-white font-medium"><Zap size={16} className="text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" /> Solar</div>
                                            <div className="flex items-center gap-2.5 text-white font-medium"><Wind size={16} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]" /> Wind</div>
                                            <div className="flex items-center gap-2.5 text-white font-medium"><Droplets size={16} className="text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]" /> Hydro</div>
                                        </div>
                                    )}

                                    {showGrid && (
                                        <div className="bg-[#0A1225]/80 backdrop-blur-xl px-6 py-5 rounded-2xl flex flex-col gap-3.5 text-sm border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                                            <div className="font-semibold text-white/90 border-b border-white/10 pb-3 mb-1 flex items-center gap-2.5 tracking-wide">
                                                <Activity size={16} className="text-blue-400 animate-pulse" />
                                                Network Transmission Lines
                                            </div>
                                            <div className="flex items-center gap-3 text-white/80"><div className="w-5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div> <span className="font-mono text-[11px] bg-red-500/10 px-1.5 rounded text-red-400 border border-red-500/20">400 kV</span> (Transport Principal)</div>
                                            <div className="flex items-center gap-3 text-white/80"><div className="w-5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div> <span className="font-mono text-[11px] bg-amber-500/10 px-1.5 rounded text-amber-500 border border-amber-500/20">225 kV</span></div>
                                            <div className="flex items-center gap-3 text-white/80"><div className="w-5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div> <span className="font-mono text-[11px] bg-blue-500/10 px-1.5 rounded text-blue-400 border border-blue-500/20">60 kV</span></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Project Details Panel */}
                    <div className="glass-panel relative flex flex-col lg:h-[816px] overflow-hidden">
                        {selectedProject ? (
                            <div className="p-6 flex-1 flex flex-col overflow-y-auto custom-scrollbar animate-fade-in space-y-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-12 h-12 rounded-xl bg-[var(--surface)] border border-[var(--surface-border)] flex items-center justify-center shadow-lg shrink-0">
                                        {getIcon(selectedProject.type)}
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold tracking-wider text-[var(--primary)] uppercase">{selectedProject.type} Power</span>
                                        <h2 className="text-xl font-bold text-white leading-tight">{selectedProject.name}</h2>
                                    </div>
                                </div>

                                <div className="bg-[var(--bg-accent)] p-4 rounded-xl border border-[var(--surface-border)] flex items-center justify-between">
                                    <div>
                                        <div className="text-xs text-[var(--text-muted)] uppercase mb-1">Location</div>
                                        <div className="text-white font-medium flex items-center gap-2 text-sm">
                                            <MapPin size={14} className="text-[var(--secondary)]" />
                                            {selectedProject.location_name}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-[var(--text-muted)] uppercase mb-1">Status</div>
                                        <div className="flex items-center justify-end gap-1.5">
                                            <span className={`w-2 h-2 rounded-full ${selectedProject.status === 'Operational' ? 'bg-emerald-500 animate-pulse' : selectedProject.status === 'Under Construction' ? 'bg-amber-500' : 'bg-slate-500'}`}></span>
                                            <span className="text-white font-medium text-sm">{selectedProject.status}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Dynamic Climate Telemetry Panel */}
                                <div className="bg-[var(--bg-accent)] p-4 rounded-xl border border-[var(--surface-border)] relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full"></div>

                                    <div className="flex justify-between items-center mb-3">
                                        <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                                            <Activity size={12} className="text-blue-400" /> Resource Potential
                                        </div>
                                        <div className="text-[9px] uppercase tracking-wider bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 font-semibold shadow-inner">
                                            NASA Power API
                                        </div>
                                    </div>

                                    {isClimateLoading ? (
                                        <div className="flex justify-center items-center h-20 w-full animate-pulse">
                                            <div className="w-5 h-5 border-2 border-[var(--surface-border)] border-t-blue-500 rounded-full animate-spin"></div>
                                        </div>
                                    ) : climateData ? (
                                        <>
                                            <div className="grid grid-cols-3 gap-2 relative z-10">
                                                <div className="bg-[var(--surface)] p-2.5 rounded-lg border border-[var(--surface-border)] text-center shadow-sm flex flex-col items-center justify-center">
                                                    <div className="text-[10px] text-[var(--text-muted)] mb-1 font-medium" title="Global Horizontal Irradiance">GHI</div>
                                                    <div className="text-sm font-bold text-amber-500">{climateData.GHI}</div>
                                                    <div className="text-[8px] text-[var(--text-muted)] mt-0.5 mb-1">kWh/m²/d</div>
                                                </div>
                                                <div className="bg-[var(--surface)] p-2.5 rounded-lg border border-[var(--surface-border)] text-center shadow-sm flex flex-col items-center justify-center">
                                                    <div className="text-[10px] text-[var(--text-muted)] mb-1 font-medium" title="Direct Normal Irradiance">DNI</div>
                                                    <div className="text-sm font-bold text-amber-500">{climateData.DNI}</div>
                                                    <div className="text-[8px] text-[var(--text-muted)] mt-0.5 mb-1">kWh/m²/d</div>
                                                </div>
                                                <div className="bg-[var(--surface)] p-2.5 rounded-lg border border-[var(--surface-border)] text-center shadow-sm flex flex-col items-center justify-center">
                                                    <div className="text-[10px] text-[var(--text-muted)] mb-1 font-medium" title="Wind Speed at 50m">Wind</div>
                                                    <div className="text-sm font-bold text-emerald-400">{climateData.Wind_Speed_50m}</div>
                                                    <div className="text-[8px] text-[var(--text-muted)] mt-0.5 mb-1">m/s</div>
                                                </div>
                                            </div>

                                            {climateData.monthly_evolution && (
                                                <div className="mt-4 border-t border-[var(--surface-border)] pt-3 relative z-10 w-full">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Evolution Annuelle</div>
                                                        <div className="flex bg-[var(--background)] rounded-md p-0.5 border border-[var(--surface-border)]">
                                                            <button onClick={() => setActiveClimateTab('GHI')} className={`text-[9px] px-2 py-0.5 rounded-sm transition-colors ${activeClimateTab === 'GHI' ? 'bg-amber-500/20 text-amber-500 font-bold' : 'text-[var(--text-muted)] hover:text-white'}`}>GHI</button>
                                                            <button onClick={() => setActiveClimateTab('DNI')} className={`text-[9px] px-2 py-0.5 rounded-sm transition-colors ${activeClimateTab === 'DNI' ? 'bg-amber-500/20 text-amber-500 font-bold' : 'text-[var(--text-muted)] hover:text-white'}`}>DNI</button>
                                                            <button onClick={() => setActiveClimateTab('Wind')} className={`text-[9px] px-2 py-0.5 rounded-sm transition-colors ${activeClimateTab === 'Wind' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-[var(--text-muted)] hover:text-white'}`}>VITESSE</button>
                                                        </div>
                                                    </div>
                                                    <div className="h-28 w-full">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <AreaChart data={climateData.monthly_evolution} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                                                                <defs>
                                                                    <linearGradient id="colorGHI" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient>
                                                                    <linearGradient id="colorWind" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34d399" stopOpacity={0.3} /><stop offset="95%" stopColor="#34d399" stopOpacity={0} /></linearGradient>
                                                                </defs>
                                                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: 'var(--text-muted)' }} />
                                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: 'var(--text-muted)' }} />
                                                                <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--surface-border)', fontSize: '10px', borderRadius: '6px' }} itemStyle={{ color: activeClimateTab === 'Wind' ? '#34d399' : '#f59e0b', fontWeight: 'bold' }} formatter={(value: any) => [`${value} ${activeClimateTab === 'Wind' ? 'm/s' : 'kWh/m²/d'}`, activeClimateTab]} />
                                                                <Area type="monotone" dataKey={activeClimateTab} stroke={activeClimateTab === 'Wind' ? '#34d399' : '#f59e0b'} strokeWidth={2} fillOpacity={1} fill={`url(#color${activeClimateTab === 'Wind' ? 'Wind' : 'GHI'})`} />
                                                            </AreaChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-xs text-[var(--text-muted)] h-16 flex items-center justify-center italic">Telemetry Unavailable</div>
                                    )}
                                </div>

                                {/* NEW: Environmental Constraints Panel */}
                                <div className="bg-[var(--bg-accent)] p-4 rounded-xl border border-[var(--surface-border)] relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full"></div>

                                    <div className="flex justify-between items-center mb-4">
                                        <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                                            <Leaf size={12} className="text-emerald-400" /> Environmental Risk
                                        </div>
                                    </div>

                                    <div className="space-y-4 relative z-10">
                                        {/* Water Stress Data */}
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="text-[11px] text-[var(--text-muted)] mb-1 flex items-center gap-1.5"><Droplet size={12} className="text-cyan-400" /> Baseline Water Stress</div>
                                                {waterStressScores[selectedProject.id] ? (
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-lg font-bold text-white">{waterStressScores[selectedProject.id].bws_score}</span>
                                                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${waterStressScores[selectedProject.id].bws_score >= 4 ? "bg-red-500/20 text-red-400 border-red-500/30" :
                                                                waterStressScores[selectedProject.id].bws_score >= 3 ? "bg-orange-500/20 text-orange-400 border-orange-500/30" :
                                                                    waterStressScores[selectedProject.id].bws_score >= 2 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                                                                        "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                                            }`}>
                                                            {waterStressScores[selectedProject.id].bws_label}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-[var(--text-muted)] italic animate-pulse">Analyzing Aqueduct data...</div>
                                                )}
                                                <div className="text-[9px] text-[var(--text-muted)] mt-1 max-w-[200px] leading-tight opacity-70">Source: WRI Aqueduct 4.0 API (2030 Business as usual)</div>
                                            </div>
                                        </div>

                                        <div className="h-px w-full bg-[var(--surface-border)]"></div>

                                        {/* SIBE Proximity */}
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="text-[11px] text-[var(--text-muted)] mb-1 flex items-center gap-1.5"><MapPin size={12} className="text-emerald-400" /> Nearest Protected Area</div>
                                                {sibeZones ? (() => {
                                                    const nearest = getNearestSibe(selectedProject.latitude, selectedProject.longitude);
                                                    if (!nearest) return <div className="text-xs text-[var(--text-muted)]">Geospatial analysis failed</div>;

                                                    const isCritical = nearest.distance < 10;
                                                    const isWarning = nearest.distance < 50;

                                                    return (
                                                        <>
                                                            <div className="text-sm font-medium text-white mb-1">{nearest.name}</div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-mono text-[var(--text-muted)]">{Math.round(nearest.distance)} km away</span>
                                                                <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${isCritical ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                                                        isWarning ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' :
                                                                            'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                                                    }`}>
                                                                    {isCritical ? 'BUFFER ZONE' : isWarning ? 'MONITOR' : 'SAFE DISTANCE'}
                                                                </span>
                                                            </div>
                                                        </>
                                                    );
                                                })() : (
                                                    <div className="text-xs text-[var(--text-muted)] italic animate-pulse">Loading UNEP-WCMC data...</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {selectedProject.type === 'Green Hydrogen' && waterStressScores[selectedProject.id] && waterStressScores[selectedProject.id].bws_score >= 3 && (
                                        <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-[10px] text-red-200">
                                            <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
                                            <p>High water stress detected. Required water desalination plant integration impacts LCOE by +$0.5-0.8/kg H2.</p>
                                        </div>
                                    )}
                                </div>

                                <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-medium hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(59,130,246,0.2)] mt-auto shrink-0">
                                    <Info size={18} />
                                    Generate Asset Report
                                </button>
                            </div>
                        ) : (
                            <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
                                <MapPin size={48} className="text-[var(--text-muted)] opacity-50 mb-4" />
                                <h3 className="text-lg font-medium text-white mb-2">Select a Project</h3>
                                <p className="text-sm text-[var(--text-muted)]">Click on any marker on the map to view detailed installation metrics and status.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
