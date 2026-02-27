"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import dynamic from "next/dynamic";

const ProjectsMap = dynamic(
    () => import("@/components/dashboard/ProjectsMap").then((mod) => mod.ProjectsMap),
    { ssr: false, loading: () => <div className="text-[var(--text-muted)] animate-pulse flex flex-col items-center justify-center min-h-[500px] gap-4">Loading map data...</div> }
);

export default function Projects() {
    return (
        <DashboardLayout>
            <ProjectsMap />
        </DashboardLayout>
    );
}
