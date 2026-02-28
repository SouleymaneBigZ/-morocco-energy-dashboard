from pydantic import BaseModel
from typing import Optional, List
from datetime import date

class ProjectBase(BaseModel):
    id: int
    name: str
    type: str
    capacity_mw: float
    location_name: str
    status: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Config:
        from_attributes = True

class RegulatoryUpdateBase(BaseModel):
    id: int
    date: date
    type: str
    title: str
    description: str
    impact_level: str

    class Config:
        from_attributes = True

class MarketDataBase(BaseModel):
    id: int
    year: int
    residential_price: float
    industrial_price: float
    turt_price: Optional[float] = None
    turd_price: Optional[float] = None
    tss_price: Optional[float] = None
    excedent_pointe_price: Optional[float] = None
    excedent_hors_pointe_price: Optional[float] = None
    renewables_percentage: float
    fossil_percentage: float
    solar_lcoe: float
    wind_lcoe: float
    fossil_lcoe: float

    class Config:
        from_attributes = True

class ReformTrackerBase(BaseModel):
    id: int
    reform_name: str
    description: str
    status: str
    completion_percentage: int

    class Config:
        from_attributes = True

class GenerationMixBase(BaseModel):
    id: int
    name: str
    value: float
    color: str
    type: str

    class Config:
        from_attributes = True

class TopLevelKPIBase(BaseModel):
    id: int
    label: str
    value: str
    subtext: str
    trend: str

    class Config:
        from_attributes = True

class HistoricalGrowthBase(BaseModel):
    id: int
    year: str
    renewables: float
    fossil: float

    class Config:
        from_attributes = True

class FinancialDataBase(BaseModel):
    id: int
    category: str
    amountBillionUSD: float
    color: str

    class Config:
        from_attributes = True
