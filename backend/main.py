from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
import database
import models
import schemas
from typing import List
import httpx

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

@app.get("/api/grid-data")
def get_grid_data():
    """
    Proxy endpoint to assemble the High Voltage electricity network from local datasets.
    Combines the 'Existing' and 'Planned' transmission line datasets into a single FeatureCollection.
    """
    import os
    import json
    from fastapi.responses import JSONResponse
    
    # Paths relative to backend directory
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    existing_path = os.path.join(base_dir, "public", "data", "existingtransmissionlines.geojson")
    future_path = os.path.join(base_dir, "public", "data", "futuretransmissionlines.geojson")

    def load_clean_geojson(file_path: str):
        if not os.path.exists(file_path):
            return {"features": []}
            
        with open(file_path, 'r', encoding='utf-8') as f:
            text_data = f.read().strip()
            
        # The World Bank currently has an export bug where it appends 'System.IO.MemoryStream' to the end of the JSON. 
        if text_data.endswith("System.IO.MemoryStream"):
            text_data = text_data.replace("System.IO.MemoryStream", "").strip()
            
        return json.loads(text_data)

    try:
        existing_data = load_clean_geojson(existing_path)
        future_data = load_clean_geojson(future_path)
        
        # Combine into one massive Feature Collection expected by react-simple-maps Geographies
        features = []
        features.extend(existing_data.get("features", []))
        features.extend(future_data.get("features", []))
        
        combined_geojson = {
            "type": "FeatureCollection",
            "features": features
        }
        
        return JSONResponse(content=combined_geojson)

    except Exception as e:
        print(f"Error proxying Grid Data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch local grid data: {str(e)}")


# --- NEW LIVE KPI SCRAPER ENDPOINT ---
import scrapers

@app.get("/api/kpis-live")
def get_kpis_live():
    """
    Endpoint that dynamically scrapes official Moroccan portals for
    live Total Capacity and Renewable Energy percentages.
    """
    scraped_data = scrapers.fetch_live_kpi_data()
    
    # We construct the payload to match what the DashboardOverview expects
    # for the Top Level KPIs but with our fresh scraped data.
    return [
        schemas.TopLevelKPIBase(
            id=1,
            label="Total Installed Capacity",
            value=f"{scraped_data['capacity_mw']:,} MW",
            change="Verified via Official Sources",
            trend="up",
            subtext=""
        ),
        schemas.TopLevelKPIBase(
            id=2,
            label="Renewables Share",
            value=f"{scraped_data['renewable_percentage']}%",
            change="Verified via Official Sources",
            trend="up",
            subtext="Target: 52% by 2030"
        ),
        schemas.TopLevelKPIBase(
            id=3,
            label="Active Projects",
            value="$14 M",
            change="Major infrastructure monitored",
            trend="down",
            subtext=""
        )
    ]

@app.get("/api/climate-data")
async def get_climate_data(
    lat: float = Query(..., description="Latitude of the location"),
    lon: float = Query(..., description="Longitude of the location")
):
    """
    Acts as a proxy connecting to the NASA POWER external API.
    Used for the Global Solar Atlas implementation to render Solar GHI, DNI, and Wind Speed on the frontend map.
    """
    url = f"https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=ALLSKY_SFC_SW_DWN,ALLSKY_SFC_SW_DNI,WS50M&community=RE&longitude={lon}&latitude={lat}&format=JSON"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            
            # Extract Annual Averages (ANN) from the NASA POWER response geometry
            parameters = data.get("properties", {}).get("parameter", {})
            ghi_annual = parameters.get("ALLSKY_SFC_SW_DWN", {}).get("ANN", "N/A")
            dni_annual = parameters.get("ALLSKY_SFC_SW_DNI", {}).get("ANN", "N/A")
            wind_annual = parameters.get("WS50M", {}).get("ANN", "N/A")
            
            return {
                "latitude": lat,
                "longitude": lon,
                "GHI": ghi_annual,
                "DNI": dni_annual,
                "Wind_Speed_50m": wind_annual,
                "units": {
                    "GHI": "kWh/m^2/day",
                    "DNI": "kWh/m^2/day",
                    "Wind_Speed_50m": "m/s"
                },
                "source": "NASA Prediction Of Worldwide Energy Resources"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch climate data from NASA POWER: {str(e)}")
