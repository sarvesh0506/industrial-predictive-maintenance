import os
import sys
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from inference.predict import PredictiveInferenceEngine

app = FastAPI(
    title="Industrial Predictive Maintenance ML Microservice",
    description="Real-time Anomaly Detection, Feature Engineering & RUL Estimation Service",
    version="1.0.0"
)

inference_engine = PredictiveInferenceEngine()

class TelemetryReadingItem(BaseModel):
    machineId: Optional[str] = "MCH-CNC-001"
    timestamp: Optional[str] = None
    temperature: float
    vibration: float
    pressure: float
    rpm: float
    current: float
    voltage: Optional[float] = 400.0

class PredictRequest(BaseModel):
    readings: List[TelemetryReadingItem]

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ml-predictive-maintenance",
        "model_loaded": inference_engine.is_loaded
    }

@app.post("/predict")
def predict_anomaly_and_rul(request: PredictRequest):
    if not request.readings:
        raise HTTPException(status_code=400, detail="Readings payload cannot be empty.")
    
    data = [item.model_dump() for item in request.readings]
    result = inference_engine.predict(data)
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
