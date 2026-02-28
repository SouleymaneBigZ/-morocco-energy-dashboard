from sqlalchemy import Column, Integer, String, Float, Date, Boolean, JSON
from geoalchemy2 import Geometry
from database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    type = Column(String, index=True) # Solar, Wind, Hydro, Fossil
    capacity_mw = Column(Float)
    location_name = Column(String)
    status = Column(String) # Operational, Under Construction, Planned
    
    # PostGIS Geometry column for exact coordinates (Point)
    geom = Column(Geometry(geometry_type='POINT', srid=4326))

class RegulatoryUpdate(Base):
    __tablename__ = "regulatory_updates"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date)
    type = Column(String) # Law, Decree, Policy
    title = Column(String)
    description = Column(String)
    impact_level = Column(String) # High, Medium, Low

class MarketData(Base):
    __tablename__ = "market_data"

    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer, index=True)
    
    # Prices in MAD/kWh
    residential_price = Column(Float)
    industrial_price = Column(Float)
    
    # Specific ANRE tariffs in MAD/kWh
    turt_price = Column(Float, nullable=True)
    turd_price = Column(Float, nullable=True)
    tss_price = Column(Float, nullable=True)
    excedent_pointe_price = Column(Float, nullable=True)
    excedent_hors_pointe_price = Column(Float, nullable=True)
    
    # Capacity Mix in %
    renewables_percentage = Column(Float)
    fossil_percentage = Column(Float)
    
    # LCOE Data in MAD/kWh
    solar_lcoe = Column(Float)
    wind_lcoe = Column(Float)
    fossil_lcoe = Column(Float)

class ReformTracker(Base):
    __tablename__ = "reform_tracker"
    
    id = Column(Integer, primary_key=True, index=True)
    reform_name = Column(String)
    description = Column(String)
    status = Column(String) # Planned, In Progress, Complete
    completion_percentage = Column(Integer)

class GenerationMix(Base):
    __tablename__ = "generation_mix"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    value = Column(Float)
    color = Column(String)
    type = Column(String) # 'current' or 'target'

class TopLevelKPI(Base):
    __tablename__ = "top_level_kpis"
    id = Column(Integer, primary_key=True, index=True)
    label = Column(String)
    value = Column(String)
    subtext = Column(String)
    trend = Column(String) # 'up', 'down', 'neutral'

class HistoricalGrowth(Base):
    __tablename__ = "historical_growth"
    id = Column(Integer, primary_key=True, index=True)
    year = Column(String)
    renewables = Column(Float)
    fossil = Column(Float)

class FinancialData(Base):
    __tablename__ = "financial_data"
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String)
    amountBillionUSD = Column(Float)
    color = Column(String)
