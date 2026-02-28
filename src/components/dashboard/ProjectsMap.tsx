"use client";

import { useState, useEffect } from "react";
import { MapPin, Info, Zap, Wind, Droplets } from "lucide-react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { useSync } from "@/context/SyncContext";

const geoUrl = "/world.json";

export function ProjectsMap() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [keyProjects, setKeyProjects] = useState < any[] > ([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedProject, setSelectedProject] = useState < any | null > (null);
    const [isLoading, setIsLoading] = useState(true);
    const { isLiveSyncEnabled } = useSync();

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

        fetchProjects();

        let interval: NodeJS.Timeout;
        if (isLiveSyncEnabled) {
            interval = setInterval(fetchProjects, 10000);
        }
        return () => clearInterval(interval);
    }, [isLiveSyncEnabled]);

    // We now receive [longitude, latitude] directly from the backend

    const getIcon = (type: string) => {
        switch (type) {
            case "Solar": return <Zap className="text-amber-500" size={16} />;
            case "Wind": return <Wind className="text-emerald-500" size={16} />;
            case "Hydro": return <Droplets className="text-blue-500" size={16} />;
            default: return <MapPin />;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Flagship Projects Map</h1>
                    <p className="text-[var(--text-muted)]">Interactive map of major renewable energy installations across Morocco</p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center min-h-[400px] w-full">
                    <div className="w-10 h-10 border-4 border-[var(--surface-border)] border-t-[var(--primary)] rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Map Visualization Area */}
                    <div className="lg:col-span-2 glass-panel p-6 min-h-[500px] relative flex items-center justify-center overflow-hidden">
                        {/* Abstract Map Background Pattern */}
                        <div className="absolute inset-0 opacity-10" style={{
                            backgroundImage: "radial-gradient(circle at 2px 2px, var(--primary) 1px, transparent 0)",
                            backgroundSize: "24px 24px"
                        }}></div>

                        <div className="absolute top-4 left-4 z-10">
                            <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">Geographical Distribution</h3>
                        </div>

                        <div className="relative w-full h-[600px] mt-8 z-10 border border-[var(--surface-border)] rounded-3xl bg-[#0A1224] shadow-2xl overflow-hidden flex items-center justify-center">

                            {/* Map Component */}
                            <ComposableMap
                                projection="geoMercator"
                                projectionConfig={{
                                    scale: 2200,
                                    center: [-8, 29.5] // Focus on Morocco coordinates
                                }}
                                className="w-full h-full outline-none"
                            >
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

                                {/* Plotting Projects */}
                                {keyProjects.map((project) => {
                                    const coordinates = [project.longitude, project.latitude];
                                    const isSelected = selectedProject && selectedProject.id === project.id;

                                    return (
                                        <Marker key={project.id} coordinates={coordinates as [number, number]}>
                                            <g
                                                transform="translate(-16, -16)" // Center the 32x32 icon
                                                className="cursor-pointer transition-all duration-300 transform outline-none"
                                                onClick={() => setSelectedProject(project)}
                                                style={{ transformOrigin: "center" }}
                                            >
                                                <circle cx="16" cy="16" r="16" fill="var(--bg-primary)" stroke={isSelected ? "var(--primary)" : "var(--surface-border)"} strokeWidth={isSelected ? 2 : 1} className="transition-all duration-300 shadow-xl" />
                                                <g transform="translate(8, 8)">
                                                    {getIcon(project.type)}
                                                </g>

                                                {isSelected && (
                                                    <circle cx="16" cy="16" r="24" fill="none" stroke="var(--primary)" strokeWidth="1" className="animate-ping opacity-50" />
                                                )}

                                                {/* Tooltip text logic */}
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
                            </ComposableMap>

                            {/* Legend Context */}
                            <div className="absolute bottom-4 left-4 glass-panel bg-[var(--bg-primary)] p-3 flex gap-4 text-xs z-20 border-[var(--surface-border)]">
                                <div className="flex items-center gap-1 text-[var(--text-muted)]"><Zap size={14} className="text-amber-500" /> Solar</div>
                                <div className="flex items-center gap-1 text-[var(--text-muted)]"><Wind size={14} className="text-emerald-500" /> Wind</div>
                                <div className="flex items-center gap-1 text-[var(--text-muted)]"><Droplets size={14} className="text-blue-500" /> Hydro</div>
                            </div>
                        </div>
                    </div>

                    {/* Project Details Panel */}
                    <div className="glass-panel relative flex flex-col">
                        {selectedProject ? (
                            <div className="p-6 flex-1 flex flex-col justify-between animate-fade-in">
                                <div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-xl bg-[var(--surface)] border border-[var(--surface-border)] flex items-center justify-center shadow-lg">
                                            {getIcon(selectedProject.type)}
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold tracking-wider text-[var(--primary)] uppercase">{selectedProject.type} Power</span>
                                            <h2 className="text-xl font-bold text-white leading-tight">{selectedProject.name}</h2>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="bg-[var(--bg-accent)] p-4 rounded-xl border border-[var(--surface-border)]">
                                            <div className="text-xs text-[var(--text-muted)] uppercase mb-1">Location</div>
                                            <div className="text-white font-medium flex items-center gap-2">
                                                <MapPin size={16} className="text-[var(--secondary)]" />
                                                {selectedProject.location_name}, Morocco
                                            </div>
                                        </div>

                                        <div className="bg-[var(--bg-accent)] p-4 rounded-xl border border-[var(--surface-border)]">
                                            <div className="text-xs text-[var(--text-muted)] uppercase mb-1">Installed Capacity</div>
                                            <div className="text-2xl text-white font-bold flex items-baseline gap-1">
                                                {selectedProject.capacity_mw} <span className="text-sm font-normal text-[var(--text-muted)]">MW</span>
                                            </div>
                                        </div>

                                        <div className="bg-[var(--bg-accent)] p-4 rounded-xl border border-[var(--surface-border)]">
                                            <div className="text-xs text-[var(--text-muted)] uppercase mb-1">Current Status</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`w-2 h-2 rounded-full 
                            ${selectedProject.status === 'Operational' ? 'bg-emerald-500 animate-pulse' :
                                                        selectedProject.status === 'Under Construction' ? 'bg-amber-500' :
                                                            'bg-slate-500'}`}></span>
                                                <span className="text-white font-medium">{selectedProject.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button className="mt-8 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/20">
                                    <Info size={18} />
                                    View Detailed Specs
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
