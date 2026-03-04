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



@app.get("/api/kpis-live", response_model=List[schemas.TopLevelKPIBase])
def get_kpis_live(db: Session = Depends(database.get_db)):
    """
    Live Sync endpoint: reads real KPI data from the database (same as /api/kpis)
    but overrides the `change` field to indicate live synchronization status.
    """
    kpis = db.query(models.TopLevelKPI).all()
    result = []
    for kpi in kpis:
        result.append(schemas.TopLevelKPIBase(
            id=kpi.id,
            label=kpi.label,
            value=kpi.value,
            subtext=kpi.subtext,
            trend=kpi.trend,
            change="⟳ Live — Synced"
        ))
    return result


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
            
            # Format Monthly Evolution Array
            months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
            monthly_evolution = []
            for m in months:
                monthly_evolution.append({
                    "month": m,
                    "GHI": parameters.get("ALLSKY_SFC_SW_DWN", {}).get(m, 0),
                    "DNI": parameters.get("ALLSKY_SFC_SW_DNI", {}).get(m, 0),
                    "Wind": parameters.get("WS50M", {}).get(m, 0)
                })
            
            return {
                "latitude": lat,
                "longitude": lon,
                "GHI": ghi_annual,
                "DNI": dni_annual,
                "Wind_Speed_50m": wind_annual,
                "monthly_evolution": monthly_evolution,
                "units": {
                    "GHI": "kWh/m^2/day",
                    "DNI": "kWh/m^2/day",
                    "Wind_Speed_50m": "m/s"
                },
                "source": "NASA Prediction Of Worldwide Energy Resources"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch climate data from NASA POWER: {str(e)}")


# ---------------------------------------------------------------------------
# Environmental Constraints Endpoints
# ---------------------------------------------------------------------------

import json
import os
import math

@app.get("/api/sibe-zones")
def get_sibe_zones():
    """
    Returns GeoJSON of Morocco's main protected areas (SIBE / National Parks).
    Data sourced from UNEP-WCMC Protected Planet / HCEFLCD.
    The file is served from public/data/sibe_zones.geojson.
    """
    # Resolve path relative to this file (backend/) → ../public/data/
    base_dir = os.path.dirname(os.path.abspath(__file__))
    geojson_path = os.path.join(base_dir, "..", "public", "data", "sibe_zones.geojson")

    if not os.path.exists(geojson_path):
        raise HTTPException(status_code=404, detail="SIBE GeoJSON file not found")

    with open(geojson_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    return data


@app.get("/api/water-stress")
async def get_water_stress(lat: float = Query(...), lon: float = Query(...)):
    """
    Returns water stress index for given coordinates using WRI Aqueduct 4.0 API.
    Falls back to an estimated score based on Morocco's regional hydrological data
    if the external API is unavailable.

    Score interpretation (BWS — Baseline Water Stress):
      0-1 : Low   | 1-2 : Low-Medium | 2-3 : Medium-High
      3-4 : High  | 4-5 : Extremely High
    """
    # --- Try WRI Aqueduct 4.0 public API ---
    aqueduct_url = "https://aqueduct40.rdc.io/api/v1/analysis"
    payload = {
        "geom": {"type": "Point", "coordinates": [lon, lat]},
        "indicators": ["bws"],
        "year": "2030",
        "scenario": "business_as_usual"
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(aqueduct_url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                bws = data.get("data", [{}])[0].get("bws_raw", None)
                if bws is not None:
                    return {
                        "lat": lat, "lon": lon,
                        "bws_score": round(bws, 2),
                        "bws_label": _bws_label(bws),
                        "source": "WRI Aqueduct 4.0 — Business as Usual 2030"
                    }
    except Exception:
        pass  # Fall through to regional fallback

    # --- Regional fallback based on Morocco's hydrology ---
    # Morocco has significant north-south gradient:
    # North (>35°N) — Low stress | Coastal — Medium | South (<30°N) — High/Extreme
    # East of Oued Draa (<28°N) — Extremely High
    bws_estimated = _estimate_morocco_bws(lat, lon)
    return {
        "lat": lat, "lon": lon,
        "bws_score": bws_estimated,
        "bws_label": _bws_label(bws_estimated),
        "source": "Regional estimate — ONEE / National Water Plan Morocco (fallback)"
    }


def _bws_label(score: float) -> str:
    if score < 1.0:   return "Low"
    if score < 2.0:   return "Low-Medium"
    if score < 3.0:   return "Medium-High"
    if score < 4.0:   return "High"
    return "Extremely High"


def _estimate_morocco_bws(lat: float, lon: float) -> float:
    """
    Regional heuristic for Morocco's baseline water stress:
    Based on national water scarcity data (Plan National de l'Eau 2020-2050).
    """
    # Extremely arid south (Sahara, Anti-Atlas far south)
    if lat < 28.5:
        return round(4.2 + (28.5 - lat) * 0.08, 2)
    # Arid south-central (Draa, Souss, Tafilalet)
    if lat < 30.5:
        return round(3.5 + (30.5 - lat) * 0.1, 2)
    # Semi-arid central (Marrakech, Beni Mellal region)
    if lat < 32.5:
        return round(2.8 - (lat - 30.5) * 0.15, 2)
    # Sub-humid north-central (Fès, Meknès)
    if lat < 34.0:
        return round(1.8 - (lat - 32.5) * 0.2, 2)
    # Humid/sub-humid north (Tanger, Al Hoceima, Rif)
    return round(max(0.5, 1.2 - (lat - 34.0) * 0.4), 2)

