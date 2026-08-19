import os
import sys
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from models.anomaly_detector import IsolationForestAnomalyDetector
from inference.predict import PredictiveInferenceEngine

app = FastAPI(
    title="Industrial Predictive Maintenance AI Microservice",
    description="Real-Time AI Anomaly Detection (Isolation Forest) & Predictive Intelligence Engine",
    version="1.0.0"
)

detector = IsolationForestAnomalyDetector()
predictive_engine = PredictiveInferenceEngine()

# Ensure model artifacts are loaded on startup if present
@app.on_event("startup")
def startup_event():
    detector.load_artifacts()
    predictive_engine.load_artifacts()

class TelemetryReadingItem(BaseModel):
    machineId: Optional[str] = "MCH-CNC-001"
    timestamp: Optional[str] = None
    temperature: float
    vibration: float
    pressure: float
    rpm: float
    current: float
    voltage: Optional[float] = 400.0

class AnomalyPredictRequest(BaseModel):
    readings: List[TelemetryReadingItem]

class AnomalyTrainRequest(BaseModel):
    readings: Optional[List[TelemetryReadingItem]] = None
    contamination: Optional[float] = 0.10

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ml-predictive-maintenance",
        "anomalyModelLoaded": detector.is_loaded,
        "modelVersion": detector.model_version
    }

@app.get("/ml/anomaly/status")
def get_anomaly_status():
    return {
        "isLoaded": detector.is_loaded,
        "modelVersion": detector.model_version,
        "contamination": detector.contamination,
        "lastTrainedAt": detector.last_trained_at,
        "featureBaselines": detector.feature_baselines
    }

@app.post("/ml/anomaly/train")
def train_anomaly_model(request: AnomalyTrainRequest):
    if request.contamination and 0.01 <= request.contamination <= 0.5:
        detector.contamination = request.contamination

    if request.readings and len(request.readings) > 0:
        data = [item.model_dump() for item in request.readings]
        df_raw = pd.DataFrame(data)
    else:
        # Generate baseline training telemetry batch
        data = []
        for i in range(120):
            data.append({
                "machineId": "MCH-CNC-001",
                "timestamp": (pd.Timestamp.now() - pd.Timedelta(minutes=120-i)).isoformat(),
                "temperature": 60.0 + (i * 0.05) + np.random.normal(0, 0.2),
                "vibration": 1.8 + (i * 0.01) + np.random.normal(0, 0.05),
                "pressure": 5.0 + np.random.normal(0, 0.1),
                "rpm": 3000.0 - (i * 0.8) + np.random.normal(0, 5.0),
                "current": 12.0 + (i * 0.04) + np.random.normal(0, 0.2),
                "voltage": 400.0 + np.random.normal(0, 0.5)
            })
        df_raw = pd.DataFrame(data)

    result = detector.fit(df_raw)
    return result

@app.post("/ml/anomaly/predict")
def predict_anomaly(request: AnomalyPredictRequest):
    if not request.readings:
        raise HTTPException(status_code=400, detail="Readings payload cannot be empty.")

    data = [item.model_dump() for item in request.readings]
    result = detector.predict(data)
    return result

@app.post("/predict")
def predict_legacy(request: AnomalyPredictRequest):
    if not request.readings:
        raise HTTPException(status_code=400, detail="Readings payload cannot be empty.")
    data = [item.model_dump() for item in request.readings]
    return detector.predict(data)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
