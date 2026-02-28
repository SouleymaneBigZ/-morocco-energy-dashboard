"use client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MarketEvaluationDashboard } from "@/components/dashboard/MarketEvaluationDashboard";

export default function Market() {
    return (
        <DashboardLayout>
            <MarketEvaluationDashboard />
        </DashboardLayout>
    );
}
