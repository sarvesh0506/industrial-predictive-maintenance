import os
import sys
import pytest
import pandas as pd
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from models.anomaly_detector import IsolationForestAnomalyDetector

@pytest.fixture
def training_batch():
    data = []
    now = pd.Timestamp.now()
    for i in range(120):
        data.append({
            "machineId": "MCH-TEST-01",
            "timestamp": (now - pd.Timedelta(minutes=120-i)).isoformat(),
            "temperature": 60.0 + np.random.normal(0, 0.2),
            "vibration": 1.8 + np.random.normal(0, 0.05),
            "pressure": 5.0 + np.random.normal(0, 0.05),
            "rpm": 3000.0 + np.random.normal(0, 5.0),
            "current": 12.0 + np.random.normal(0, 0.1),
            "voltage": 400.0 + np.random.normal(0, 0.5)
        })
    return data

def test_anomaly_detector_training(training_batch, tmp_path):
    detector = IsolationForestAnomalyDetector(artifact_dir=str(tmp_path), contamination=0.10)
    df_raw = pd.DataFrame(training_batch)
    
    result = detector.fit(df_raw)
    
    assert result["status"] == "SUCCESS"
    assert result["modelVersion"] == "v1.0-IsolationForest"
    assert os.path.exists(os.path.join(tmp_path, "isolation_forest.joblib"))
    assert os.path.exists(os.path.join(tmp_path, "anomaly_config.json"))

def test_anomaly_detector_predict_normal(training_batch, tmp_path):
    detector = IsolationForestAnomalyDetector(artifact_dir=str(tmp_path))
    detector.fit(pd.DataFrame(training_batch))

    now = pd.Timestamp.now()
    normal_readings = [
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=5)).isoformat(), "temperature": 60.0, "vibration": 1.8, "pressure": 5.0, "rpm": 3000.0, "current": 12.0, "voltage": 400.0},
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=4)).isoformat(), "temperature": 60.1, "vibration": 1.81, "pressure": 5.0, "rpm": 3002.0, "current": 12.0, "voltage": 400.1},
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=3)).isoformat(), "temperature": 60.2, "vibration": 1.79, "pressure": 5.0, "rpm": 2998.0, "current": 12.1, "voltage": 399.9},
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=2)).isoformat(), "temperature": 60.0, "vibration": 1.80, "pressure": 5.0, "rpm": 3001.0, "current": 12.0, "voltage": 400.0},
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=1)).isoformat(), "temperature": 60.1, "vibration": 1.82, "pressure": 5.0, "rpm": 2999.0, "current": 12.1, "voltage": 400.1}
    ]

    pred = detector.predict(normal_readings)
    
    assert pred["machineId"] == "MCH-TEST-01"
    assert pred["status"] in ["NORMAL", "WARNING"]
    assert pred["anomalyScore"] < 0.70
    assert pred["modelVersion"] == "v1.0-IsolationForest"

def test_anomaly_detector_predict_anomalous(training_batch, tmp_path):
    detector = IsolationForestAnomalyDetector(artifact_dir=str(tmp_path))
    detector.fit(pd.DataFrame(training_batch))

    now = pd.Timestamp.now()
    anomalous_readings = [
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=5)).isoformat(), "temperature": 60.0, "vibration": 1.8, "pressure": 5.0, "rpm": 3000.0, "current": 12.0, "voltage": 400.0},
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=4)).isoformat(), "temperature": 65.0, "vibration": 3.0, "pressure": 4.5, "rpm": 2800.0, "current": 15.0, "voltage": 398.0},
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=3)).isoformat(), "temperature": 75.0, "vibration": 5.5, "pressure": 3.5, "rpm": 2400.0, "current": 20.0, "voltage": 395.0},
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=2)).isoformat(), "temperature": 88.0, "vibration": 9.0, "pressure": 2.5, "rpm": 1800.0, "current": 28.0, "voltage": 390.0},
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=1)).isoformat(), "temperature": 105.0, "vibration": 16.5, "pressure": 1.0, "rpm": 1100.0, "current": 39.0, "voltage": 380.0}
    ]

    pred = detector.predict(anomalous_readings)
    
    assert pred["machineId"] == "MCH-TEST-01"
    assert pred["status"] == "ANOMALOUS"
    assert pred["anomalyScore"] >= 0.70
    assert len(pred["importantFeatures"]) > 0

def test_important_features_attribution(training_batch, tmp_path):
    detector = IsolationForestAnomalyDetector(artifact_dir=str(tmp_path))
    detector.fit(pd.DataFrame(training_batch))

    now = pd.Timestamp.now()
    spiking_readings = [
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=5)).isoformat(), "temperature": 60.0, "vibration": 1.8, "pressure": 5.0, "rpm": 3000.0, "current": 12.0, "voltage": 400.0},
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=4)).isoformat(), "temperature": 60.0, "vibration": 3.5, "pressure": 5.0, "rpm": 3000.0, "current": 12.0, "voltage": 400.0},
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=3)).isoformat(), "temperature": 60.0, "vibration": 7.0, "pressure": 5.0, "rpm": 3000.0, "current": 12.0, "voltage": 400.0},
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=2)).isoformat(), "temperature": 60.0, "vibration": 12.0, "pressure": 5.0, "rpm": 3000.0, "current": 12.0, "voltage": 400.0},
        {"machineId": "MCH-TEST-01", "timestamp": (now - pd.Timedelta(minutes=1)).isoformat(), "temperature": 60.0, "vibration": 19.5, "pressure": 5.0, "rpm": 3000.0, "current": 12.0, "voltage": 400.0}
    ]

    pred = detector.predict(spiking_readings)
    features = [f["feature"] for f in pred["importantFeatures"]]
    
    assert any("vibration" in f for f in features)
