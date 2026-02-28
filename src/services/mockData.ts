// mockData.ts

export interface EnergyData {
  name: string;
  value: number;
  color: string;
}

export interface Metric {
  label: string;
  value: string;
  subtext: string;
  trend: "up" | "down" | "neutral";
}

export interface Project {
  id: string;
  name: string;
  type: "Solar" | "Wind" | "Hydro";
  capacityMW: number;
  status: "Operational" | "Under Construction" | "Planned";
  location: string;
}

// Data sources: MEM (Ministry of Energy Transition and Sustainable Development), ONEE, MASEN
// Note: As real-time public APIs for Moroccan energy are limited, these figures are based on 
// official reports and announcements up to 2023/2024.

// 2024 Generation Capacity Mix (Based on ONEE / MEM Official 2024 reports)
export const currentGenerationMix: EnergyData[] = [
  { name: "Coal", value: 34.2, color: "#475569" }, // Approx adjustment
  { name: "Natural Gas / Fuel", value: 20.5, color: "#64748b" },
  { name: "Solar", value: 7.8, color: "#F59E0B" }, // 934 MW
  { name: "Wind", value: 17.7, color: "#10B981" }, // 2.128 GW
  { name: "Hydro", value: 19.8, color: "#3B82F6" } // 2.12 GW
];

// Official Target 2030 (To exceed 52%)
export const targetGenerationMix2030: EnergyData[] = [
  { name: "Fossil Fuels", value: 48, color: "#475569" },
  { name: "Solar", value: 20, color: "#F59E0B" },
  { name: "Wind", value: 20, color: "#10B981" },
  { name: "Hydro", value: 12, color: "#3B82F6" },
];

export const topLevelKPIs: Metric[] = [
  {
    label: "Total Installed Capacity",
    value: "12,016 MW", // Based on ONEE 2024 report
    subtext: "Source: ONEE / MEM (End 2024)",
    trend: "up"
  },
  {
    label: "Renewable Energy Share",
    value: "45.3%", // Official capacity share end 2024
    subtext: "Target 2030: >52%",
    trend: "up"
  },
  {
    label: "Active Projects Investment",
    value: "$1.4B / yr", // Average $1.4B (14B MAD) yearly 2023-2027
    subtext: "Principally Wind & Solar expansion",
    trend: "up"
  }
];

export const keyProjects: Project[] = [
  {
    id: "p1",
    name: "Noor Ouarzazate Complex",
    type: "Solar",
    capacityMW: 580,
    status: "Operational",
    location: "Ouarzazate"
  },
  {
    id: "p2",
    name: "Tarfaya Wind Farm",
    type: "Wind",
    capacityMW: 301,
    status: "Operational",
    location: "Tarfaya"
  },
  {
    id: "p3",
    name: "Noor Midelt I", // Advanced hybrid solar
    type: "Solar",
    capacityMW: 800,
    status: "Under Construction",
    location: "Midelt"
  },
  {
    id: "p4",
    name: "Aftissat Wind Farm",
    type: "Wind",
    capacityMW: 201, // Recently expanded
    status: "Operational",
    location: "Boujdour"
  },
  {
    id: "p5",
    name: "Abdelmoumen STEP", // Pumped storage hydro
    type: "Hydro",
    capacityMW: 350,
    status: "Under Construction",
    location: "Agadir"
  }
];

// Based on historical trajectory and World Bank data (EG.ELC.RNEW.ZS) extrapolated
export const historicalGrowth = [
  { year: "2015", renewables: 32, fossil: 68 },
  { year: "2018", renewables: 34, fossil: 66 },
  { year: "2020", renewables: 37, fossil: 63 },
  { year: "2022", renewables: 38, fossil: 62 },
  { year: "2023", renewables: 38, fossil: 62 },
  { year: "2030 (Goal)", renewables: 52, fossil: 48 },
];

export interface FinancialData {
  category: string;
  amountBillionUSD: number;
  color: string;
}

export const investmentDistribution: FinancialData[] = [
  { category: "Solar Power", amountBillionUSD: 3.2, color: "#F59E0B" },
  { category: "Wind Power", amountBillionUSD: 2.8, color: "#10B981" },
  { category: "Hydro & Pumped Storage", amountBillionUSD: 1.5, color: "#3B82F6" },
  { category: "Grid Infrastructure", amountBillionUSD: 1.2, color: "#8B5CF6" },
  { category: "Green Hydrogen Init.", amountBillionUSD: 0.8, color: "#06B6D4" },
];

export interface RegulatoryUpdate {
  id: string;
  date: string;
  title: string;
  type: "Law" | "Decree" | "Policy" | "Tender";
  description: string;
}

export const regulatoryUpdates: RegulatoryUpdate[] = [
  {
    id: "r1",
    date: "Mar 2024",
    title: "Green Hydrogen Offer (Offre Maroc)",
    type: "Policy",
    description: "Launch of the 'Offre Maroc' for green hydrogen, allocating 1 million hectares for investors to develop integrated H2 projects."
  },
  {
    id: "r2",
    date: "Dec 2023",
    title: "Amendments to Law 13-09",
    type: "Law",
    description: "Simplification of procedures for self-production and opening the medium-voltage market for private renewable energy producers."
  },
  {
    id: "r3",
    date: "Sep 2023",
    title: "Noor Midelt III Tender",
    type: "Tender",
    description: "MASEN issues pre-qualification for the 400MW Noor Midelt III solar project, emphasizing storage capabilities."
  },
  {
    id: "r4",
    date: "Jan 2023",
    title: "Law 82-21 on Self-Production",
    type: "Law",
    description: "Enactment of the law allowing individuals and industrial sites to produce their own electricity from renewable sources."
  }
];
