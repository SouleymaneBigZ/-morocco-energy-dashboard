from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
import database
import models
import schemas
from typing import List

# Wait to create tables until DB is configured via Postgres.app
# models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Morocco Energy API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Morocco Energy Dashboard API"}

@app.get("/api/projects", response_model=List[schemas.ProjectBase])
def get_projects(db: Session = Depends(database.get_db)):
    # Returns all projects with manually extracted coordinates from PostGIS
    projects = db.query(
        models.Project.id,
        models.Project.name,
        models.Project.type,
        models.Project.capacity_mw,
        models.Project.location_name,
        models.Project.status,
        func.ST_Y(models.Project.geom).label('latitude'),
        func.ST_X(models.Project.geom).label('longitude')
    ).all()
    
    # Convert Row objects to dictionaries to match the Pydantic schema
    return [
        schemas.ProjectBase(
            id=p.id,
            name=p.name,
            type=p.type,
            capacity_mw=p.capacity_mw,
            location_name=p.location_name,
            status=p.status,
            latitude=p.latitude,
            longitude=p.longitude
        ) for p in projects
    ]

@app.get("/api/market-data", response_model=List[schemas.MarketDataBase])
def get_market_data(db: Session = Depends(database.get_db)):
    market_data = db.query(models.MarketData).all()
    return market_data

@app.get("/api/reforms", response_model=List[schemas.ReformTrackerBase])
def get_reforms(db: Session = Depends(database.get_db)):
    reforms = db.query(models.ReformTracker).all()
    return reforms

@app.get("/api/generation-mix", response_model=List[schemas.GenerationMixBase])
def get_generation_mix(db: Session = Depends(database.get_db)):
    mix = db.query(models.GenerationMix).all()
    return mix

@app.get("/api/kpis", response_model=List[schemas.TopLevelKPIBase])
def get_kpis(db: Session = Depends(database.get_db)):
    kpis = db.query(models.TopLevelKPI).all()
    return kpis

@app.get("/api/historical-growth", response_model=List[schemas.HistoricalGrowthBase])
def get_historical_growth(db: Session = Depends(database.get_db)):
    growth = db.query(models.HistoricalGrowth).all()
    return growth

@app.get("/api/financials", response_model=List[schemas.FinancialDataBase])
def get_financials(db: Session = Depends(database.get_db)):
    financials = db.query(models.FinancialData).all()
    return financials

@app.get("/api/regulations", response_model=List[schemas.RegulatoryUpdateBase])
def get_regulations(db: Session = Depends(database.get_db)):
    updates = db.query(models.RegulatoryUpdate).all()
    return updates

