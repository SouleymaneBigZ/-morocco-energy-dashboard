import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FinancialsDashboard } from "@/components/dashboard/FinancialsDashboard";

export default function Financials() {
    return (
        <DashboardLayout>
            <FinancialsDashboard />
        </DashboardLayout>
    );
}
