import os
import sys
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from models.anomaly_detector import IsolationForestAnomalyDetector
from models.failure_predictor import MachineFailurePredictor
from training.generate_failure_dataset import generate_synthetic_failure_dataset

app = FastAPI(
    title="Industrial Predictive Maintenance AI Microservice",
    description="Real-Time AI Anomaly Detection, Machine Failure Mode Prediction & Risk Assessment Engine",
    version="1.0.0"
)

anomaly_detector = IsolationForestAnomalyDetector()
failure_predictor = MachineFailurePredictor()

@app.on_event("startup")
def startup_event():
    anomaly_detector.load_artifacts()
    failure_predictor.load_artifacts()

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

class FailureTrainRequest(BaseModel):
    samplesPerClass: Optional[int] = 120

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ml-predictive-maintenance",
        "anomalyModelLoaded": anomaly_detector.is_loaded,
        "failureModelLoaded": failure_predictor.is_loaded,
        "modelVersion": failure_predictor.model_version
    }

# Anomaly Detection Endpoints
@app.get("/ml/anomaly/status")
def get_anomaly_status():
    return {
        "isLoaded": anomaly_detector.is_loaded,
        "modelVersion": anomaly_detector.model_version,
        "contamination": anomaly_detector.contamination,
        "lastTrainedAt": anomaly_detector.last_trained_at
    }

@app.post("/ml/anomaly/train")
def train_anomaly_model():
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
    return anomaly_detector.fit(df_raw)

@app.post("/ml/anomaly/predict")
def predict_anomaly(request: PredictRequest):
    if not request.readings:
        raise HTTPException(status_code=400, detail="Readings payload cannot be empty.")
    data = [item.model_dump() for item in request.readings]
    return anomaly_detector.predict(data)

# Machine Failure Prediction Endpoints
@app.post("/ml/failure/train")
def train_failure_model(request: FailureTrainRequest):
    samples = request.samplesPerClass if request.samplesPerClass else 120
    df_synth = generate_synthetic_failure_dataset(samples_per_class=samples)
    result = failure_predictor.train_and_evaluate(df_synth)
    return result

@app.post("/ml/failure/predict")
def predict_failure(request: PredictRequest):
    if not request.readings:
        raise HTTPException(status_code=400, detail="Readings payload cannot be empty.")
    data = [item.model_dump() for item in request.readings]
    return failure_predictor.predict(data)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
