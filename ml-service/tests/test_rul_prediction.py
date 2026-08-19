import os
import sys
import pytest
import pandas as pd
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from training.generate_failure_dataset import generate_synthetic_failure_dataset
from models.rul_predictor import RulPredictor

@pytest.fixture
def synthetic_dataset():
    return generate_synthetic_failure_dataset(samples_per_class=40, seed=42)

def test_rul_predictor_training(synthetic_dataset, tmp_path):
    predictor = RulPredictor(artifact_dir=str(tmp_path))
    report = predictor.train_and_evaluate(synthetic_dataset)

    assert "metrics" in report
    assert "MAE" in report["metrics"]
    assert "RMSE" in report["metrics"]
    assert "R2" in report["metrics"]
    assert os.path.exists(os.path.join(tmp_path, "rul_regressor.joblib"))
    assert os.path.exists(os.path.join(tmp_path, "rul_evaluation_report.json"))

def test_rul_prediction_inference_nominal(synthetic_dataset, tmp_path):
    predictor = RulPredictor(artifact_dir=str(tmp_path))
    predictor.train_and_evaluate(synthetic_dataset)

    now = pd.Timestamp.now()
    normal_readings = [
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=5)).isoformat(), "temperature": 60.0, "vibration": 1.8, "pressure": 5.0, "rpm": 3000.0, "current": 12.0, "voltage": 400.0},
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=4)).isoformat(), "temperature": 60.1, "vibration": 1.81, "pressure": 5.0, "rpm": 3002.0, "current": 12.0, "voltage": 400.1},
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=3)).isoformat(), "temperature": 60.2, "vibration": 1.79, "pressure": 5.0, "rpm": 2998.0, "current": 12.1, "voltage": 399.9},
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=2)).isoformat(), "temperature": 60.0, "vibration": 1.80, "pressure": 5.0, "rpm": 3001.0, "current": 12.0, "voltage": 400.0},
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=1)).isoformat(), "temperature": 60.1, "vibration": 1.82, "pressure": 5.0, "rpm": 2999.0, "current": 12.1, "voltage": 400.1}
    ]

    pred = predictor.predict(normal_readings)

    assert pred["machineId"] == "MCH-TEST-01"
    assert pred["estimatedRemainingHours"] > 300.0
    assert pred["confidenceOrUncertainty"] >= 0.70
    assert "disclaimer" in pred
    assert "AI estimate" in pred["disclaimer"]

def test_rul_prediction_inference_degraded(synthetic_dataset, tmp_path):
    predictor = RulPredictor(artifact_dir=str(tmp_path))
    predictor.train_and_evaluate(synthetic_dataset)

    now = pd.Timestamp.now()
    degraded_readings = [
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=5)).isoformat(), "temperature": 65.0, "vibration": 3.0, "pressure": 5.0, "rpm": 3000.0, "current": 12.0, "voltage": 400.0},
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=4)).isoformat(), "temperature": 75.0, "vibration": 7.0, "pressure": 4.5, "rpm": 2800.0, "current": 14.0, "voltage": 400.0},
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=3)).isoformat(), "temperature": 88.0, "vibration": 12.0, "pressure": 4.0, "rpm": 2500.0, "current": 18.0, "voltage": 395.0},
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=2)).isoformat(), "temperature": 105.0, "vibration": 18.0, "pressure": 3.0, "rpm": 2000.0, "current": 24.0, "voltage": 390.0},
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=1)).isoformat(), "temperature": 125.0, "vibration": 25.0, "pressure": 2.0, "rpm": 1500.0, "current": 32.0, "voltage": 380.0}
    ]

    pred = predictor.predict(degraded_readings)

    assert pred["estimatedRemainingHours"] < 250.0
    assert pred["confidenceOrUncertainty"] > 0.0
