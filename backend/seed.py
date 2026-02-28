from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from models import Base, Project, MarketData, ReformTracker, RegulatoryUpdate, GenerationMix, TopLevelKPI, HistoricalGrowth, FinancialData
from database import engine, SessionLocal
import datetime

# Enable PostGIS extension
with engine.connect() as conn:
    conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
    conn.commit()

# Create tables
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Seed Projects (Morocco Renewable Flagships)
if db.query(Project).count() == 0:
    projects = [
        Project(name="Noor Ouarzazate Complex", type="Solar", capacity_mw=580, location_name="Ouarzazate", status="Operational", geom="SRID=4326;POINT(-6.9118 30.9335)"),
        Project(name="Tarfaya Wind Farm", type="Wind", capacity_mw=301, location_name="Tarfaya", status="Operational", geom="SRID=4326;POINT(-12.9248 27.9392)"),
        Project(name="Noor Midelt I", type="Solar", capacity_mw=210, location_name="Midelt", status="Under Construction", geom="SRID=4326;POINT(-4.7397 32.6844)"), # Updated to 210MW PV phase
        Project(name="Aftissat Wind Farm", type="Wind", capacity_mw=201, location_name="Boujdour", status="Operational", geom="SRID=4326;POINT(-14.4831 26.1264)"),
        Project(name="Abdelmoumen STEP", type="Hydro", capacity_mw=350, location_name="Agadir", status="Under Construction", geom="SRID=4326;POINT(-9.5981 30.4202)")
    ]
    db.add_all(projects)

if db.query(MarketData).count() == 0:
    data = MarketData(
        year=2024,
        residential_price=1.17,
        industrial_price=1.07,
        renewables_percentage=45.3,
        fossil_percentage=54.7,
        solar_lcoe=0.37,
        wind_lcoe=0.41,
        fossil_lcoe=0.90
    )
    db.add(data)

if db.query(ReformTracker).count() == 0:
    reforms = [
        ReformTracker(reform_name="Law 82-21 (Self-Generation)", description="Enables robust self-production of electricity with grid access from 5MW and 20% surplus sales.", status="Complete", completion_percentage=100),
        ReformTracker(reform_name="ANRE Grid Capacity Publication", description="Publication of the 10,429 MW hosting capacity for 2026-2030 to foster transparency.", status="Complete", completion_percentage=100),
        ReformTracker(reform_name="Network Access Tariffs (Wheeling)", description="Setting clear wheeling charges for the 2024-2027 period to lower investor costs.", status="Complete", completion_percentage=100),
        ReformTracker(reform_name="Medium-Voltage Distribution Tariffs", description="Preparing tariffs for the MV electricity distribution network.", status="In Progress", completion_percentage=75),
        ReformTracker(reform_name="ONEE Accounting Separation", description="Separation of ONEE's accounting to ensure transmission system operator independence.", status="In Progress", completion_percentage=80)
    ]
    db.add_all(reforms)

if db.query(GenerationMix).count() == 0:
    mix = [
        GenerationMix(name="Coal", value=34.2, color="#475569", type="current"),
        GenerationMix(name="Natural Gas / Fuel", value=20.5, color="#64748b", type="current"),
        GenerationMix(name="Solar", value=7.8, color="#F59E0B", type="current"),
        GenerationMix(name="Wind", value=17.7, color="#10B981", type="current"),
        GenerationMix(name="Hydro", value=19.8, color="#3B82F6", type="current"),
        
        GenerationMix(name="Fossil Fuels", value=48.0, color="#475569", type="target"),
        GenerationMix(name="Solar", value=20.0, color="#F59E0B", type="target"),
        GenerationMix(name="Wind", value=20.0, color="#10B981", type="target"),
        GenerationMix(name="Hydro", value=12.0, color="#3B82F6", type="target"),
    ]
    db.add_all(mix)

if db.query(TopLevelKPI).count() == 0:
    kpis = [
        TopLevelKPI(label="Total Installed Capacity", value="12,016 MW", subtext="Source: ONEE / MEM (End 2024)", trend="up"),
        TopLevelKPI(label="Renewable Energy Share", value="45.3%", subtext="Target 2030: >52%", trend="up"),
        TopLevelKPI(label="Active Projects Investment", value="$1.4B / yr", subtext="Wind & Solar expansion (2023-2027)", trend="up")
    ]
    db.add_all(kpis)

if db.query(HistoricalGrowth).count() == 0:
    growth = [
        HistoricalGrowth(year="2015", renewables=32.0, fossil=68.0),
        HistoricalGrowth(year="2018", renewables=35.0, fossil=65.0),
        HistoricalGrowth(year="2020", renewables=37.0, fossil=63.0),
        HistoricalGrowth(year="2022", renewables=38.0, fossil=62.0),
        HistoricalGrowth(year="2023", renewables=40.0, fossil=60.0),
        HistoricalGrowth(year="2024", renewables=45.3, fossil=54.7),
        HistoricalGrowth(year="2030 (Goal)", renewables=52.0, fossil=48.0),
    ]
    db.add_all(growth)

if db.query(FinancialData).count() == 0:
    financials = [
        FinancialData(category="Wind Power", amountBillionUSD=3.6, color="#10B981"),
        FinancialData(category="Solar Power", amountBillionUSD=3.0, color="#F59E0B"),
        FinancialData(category="Grid Infrastructure", amountBillionUSD=2.3, color="#8B5CF6"),
        FinancialData(category="Hydro & Pumped Storage", amountBillionUSD=1.5, color="#3B82F6"),
        FinancialData(category="Green Hydrogen Init.", amountBillionUSD=1.0, color="#06B6D4"),
    ]
    db.add_all(financials)

if db.query(RegulatoryUpdate).count() == 0:
    updates = [
        RegulatoryUpdate(date=datetime.date(2024, 3, 1), title="Green Hydrogen Offer (Offre Maroc)", type="Policy", description="Launch of the 'Offre Maroc' for green hydrogen, allocating 1 million hectares for investors.", impact_level="High"),
        RegulatoryUpdate(date=datetime.date(2023, 12, 1), title="Amendments to Law 13-09", type="Law", description="Simplification of procedures for self-production and opening the medium-voltage market.", impact_level="High"),
        RegulatoryUpdate(date=datetime.date(2024, 1, 15), title="Grid Capacity Publication", type="Policy", description="ANRE publishes 10,429 MW hosting capacity for 2026-2030 to foster grid transparency.", impact_level="Medium"),
        RegulatoryUpdate(date=datetime.date(2023, 1, 1), title="Law 82-21 on Self-Production", type="Law", description="Enactment of the law allowing individuals and industrial sites to produce their own electricity.", impact_level="High")
    ]
    db.add_all(updates)

db.commit()
db.close()
print("Database seeded successfully with all comprehensive 2024 data!")
