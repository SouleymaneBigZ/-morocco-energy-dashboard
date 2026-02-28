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


import requests
import json
from fastapi.responses import JSONResponse

@app.get("/api/grid-data")
def get_grid_data():
    """
    Proxy endpoint to fetch the latest High Voltage electricity network from the World Bank.
    Dataset ID: 0039843 (Morocco Electricity Transmission Network)
    """
    try:
        # 1. Ask the World Bank for the latest Metadata of the package
        wb_api_url = "https://datacatalogapi.worldbank.org/ddhxext/DatasetView?dataset_unique_id=0039843"
        metadata_req = requests.get(wb_api_url, timeout=10)
        metadata_req.raise_for_status()
        metadata = metadata_req.json()
        
        # 2. Extract the actual download URLs for the GeoJSON files
        existing_url = None
        future_url = None
        
        for resource in metadata.get("Resources", []):
            name = resource.get("name", "")
            url = resource.get("url", "")
            
            if "geojson" in url.lower():
                if "existing" in name.lower() or "DR0049574" in url:
                    existing_url = url
                elif "planned" in name.lower() or "future" in name.lower() or "DR0049575" in url:
                    future_url = url

        if not existing_url or not future_url:
            raise HTTPException(status_code=500, detail="Could not find the GeoJSON resources from the World Bank API")

        # 3. Helper function to fetch, strip arbitrary trailing bytes, and parse
        def fetch_clean_geojson(url: str):
            res = requests.get(url, timeout=15)
            res.raise_for_status()
            text_data = res.text.strip()
            
            # The World Bank currently has an export bug where it appends 'System.IO.MemoryStream' to the end of the JSON. 
            # We must gracefully slice it away before parsing.
            if text_data.endswith("System.IO.MemoryStream"):
                text_data = text_data.replace("System.IO.MemoryStream", "").strip()
                
            return json.loads(text_data)

        # 4. Fetch the data simultaneously (Sequential in this simple script)
        existing_data = fetch_clean_geojson(existing_url)
        future_data = fetch_clean_geojson(future_url)
        
        # 5. Combine into one massive Feature Collection
        features = []
        features.extend(existing_data.get("features", []))
        features.extend(future_data.get("features", []))
        
        combined_geojson = {
            "type": "FeatureCollection",
            "features": features
        }
        
        return JSONResponse(content=combined_geojson)

    except Exception as e:
        print(f"Error proxying World Bank Data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch live grid data: {str(e)}")
