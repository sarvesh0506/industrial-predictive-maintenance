import os
import sys
import pytest
import pandas as pd
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from training.generate_failure_dataset import generate_synthetic_failure_dataset
from models.failure_predictor import MachineFailurePredictor

@pytest.fixture
def synthetic_dataset():
    return generate_synthetic_failure_dataset(samples_per_class=40, seed=42)

def test_synthetic_dataset_generation(synthetic_dataset):
    assert not synthetic_dataset.empty
    assert len(synthetic_dataset) == 200
    assert "failure_label" in synthetic_dataset.columns
    assert "failure_type" in synthetic_dataset.columns
    assert synthetic_dataset["is_synthetic"].all()

def test_failure_predictor_training_and_comparison(synthetic_dataset, tmp_path):
    predictor = MachineFailurePredictor(artifact_dir=str(tmp_path))
    report = predictor.train_and_evaluate(synthetic_dataset)

    assert "chosenAlgorithm" in report
    assert report["chosenAlgorithm"] in ["RandomForestClassifier", "GradientBoostingClassifier"]
    assert "metrics" in report
    assert "accuracy" in report["metrics"]
    assert "f1Score" in report["metrics"]
    assert "confusionMatrix" in report["metrics"]
    assert "candidateComparison" in report
    assert os.path.exists(os.path.join(tmp_path, "failure_classifier.joblib"))
    assert os.path.exists(os.path.join(tmp_path, "failure_evaluation_report.json"))

def test_failure_prediction_inference_normal(synthetic_dataset, tmp_path):
    predictor = MachineFailurePredictor(artifact_dir=str(tmp_path))
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
    assert pred["predictedFailureType"] == "NORMAL"
    assert pred["riskLevel"] == "LOW"
    assert pred["failureProbability"] < 0.25
    assert "disclaimer" in pred

def test_failure_prediction_inference_overheating(synthetic_dataset, tmp_path):
    predictor = MachineFailurePredictor(artifact_dir=str(tmp_path))
    predictor.train_and_evaluate(synthetic_dataset)

    now = pd.Timestamp.now()
    overheating_readings = [
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=5)).isoformat(), "temperature": 65.0, "vibration": 1.8, "pressure": 5.0, "rpm": 3000.0, "current": 12.0, "voltage": 400.0},
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=4)).isoformat(), "temperature": 75.0, "vibration": 1.8, "pressure": 5.0, "rpm": 3000.0, "current": 12.5, "voltage": 400.0},
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=3)).isoformat(), "temperature": 88.0, "vibration": 1.9, "pressure": 5.0, "rpm": 3000.0, "current": 13.0, "voltage": 400.0},
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=2)).isoformat(), "temperature": 102.0, "vibration": 2.0, "pressure": 5.0, "rpm": 3000.0, "current": 14.0, "voltage": 400.0},
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=1)).isoformat(), "temperature": 118.0, "vibration": 2.1, "pressure": 5.0, "rpm": 3000.0, "current": 15.0, "voltage": 400.0}
    ]

    pred = predictor.predict(overheating_readings)

    assert pred["predictedFailureType"] == "OVERHEATING"
    assert pred["riskLevel"] in ["HIGH", "CRITICAL"]
    assert pred["failureProbability"] >= 0.55

def test_failure_prediction_inference_bearing_degradation(synthetic_dataset, tmp_path):
    predictor = MachineFailurePredictor(artifact_dir=str(tmp_path))
    predictor.train_and_evaluate(synthetic_dataset)

    now = pd.Timestamp.now()
    bearing_readings = [
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=5)).isoformat(), "temperature": 60.0, "vibration": 2.0, "pressure": 5.0, "rpm": 3000.0, "current": 12.0, "voltage": 400.0},
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=4)).isoformat(), "temperature": 62.0, "vibration": 5.0, "pressure": 5.0, "rpm": 3000.0, "current": 12.0, "voltage": 400.0},
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=3)).isoformat(), "temperature": 64.0, "vibration": 9.5, "pressure": 5.0, "rpm": 3000.0, "current": 12.0, "voltage": 400.0},
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=2)).isoformat(), "temperature": 68.0, "vibration": 15.0, "pressure": 5.0, "rpm": 3000.0, "current": 12.0, "voltage": 400.0},
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=1)).isoformat(), "temperature": 72.0, "vibration": 22.0, "pressure": 5.0, "rpm": 3000.0, "current": 12.0, "voltage": 400.0}
    ]

    pred = predictor.predict(bearing_readings)

    assert pred["predictedFailureType"] == "BEARING_DEGRADATION"
    assert pred["riskLevel"] in ["HIGH", "CRITICAL"]
    assert pred["failureProbability"] >= 0.55
