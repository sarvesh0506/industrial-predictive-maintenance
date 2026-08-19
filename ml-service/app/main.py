from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import datetime

app = FastAPI(
    title="Industrial Predictive Maintenance AI Service",
    description="FastAPI service for anomaly detection and Remaining Useful Life (RUL) predictions",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TelemetryPayload(BaseModel):
    sensor_id: int
    sensor_type: str
    values: List[float]

class PredictionResult(BaseModel):
    machine_id: int
    failure_probability: float
    predicted_rul_hours: float
    anomaly_score: float
    status: str
    timestamp: str

@app.get("/health")
def health_check():
    """Health check endpoint required by platform specifications."""
    return {
        "status": "healthy",
        "service": "ml-service",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
    }

@app.post("/predict", response_model=PredictionResult)
def predict_machine_health(payload: TelemetryPayload):
    """Predict machine failure probability and RUL based on sensor telemetry."""
    avg_val = sum(payload.values) / max(len(payload.values), 1)
    
    # Baseline dummy heuristic model for initial setup
    anomaly_score = max(0.0, min(1.0, (avg_val - 50.0) / 50.0))
    failure_probability = round(anomaly_score * 0.85, 4)
    rul_hours = round(max(10.0, 1000.0 * (1.0 - anomaly_score)), 1)
    status = "WARNING" if anomaly_score > 0.6 else "HEALTHY"

    return PredictionResult(
        machine_id=payload.sensor_id,
        failure_probability=failure_probability,
        predicted_rul_hours=rul_hours,
        anomaly_score=round(anomaly_score, 4),
        status=status,
        timestamp=datetime.datetime.utcnow().isoformat() + "Z"
    )
