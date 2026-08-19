import os
import sys
import json
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple
from sklearn.ensemble import IsolationForest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from preprocessing.pipeline import IndustrialDataPipeline

class IsolationForestAnomalyDetector:
    """
    Production Isolation Forest Anomaly Detection Engine.
    Handles model training, persistence, normalized anomaly score calculation,
    classification (NORMAL, WARNING, ANOMALOUS), and feature importance attribution.
    """
    FEATURE_COLS = [
        "temperature_mean", "temperature_std", "temperature_trend",
        "vibration_mean", "vibration_std", "vibration_trend",
        "pressure_mean", "pressure_std",
        "rpm_mean", "rpm_trend",
        "current_mean", "current_trend"
    ]

    def __init__(self, artifact_dir: str = "models", contamination: float = 0.10):
        self.artifact_dir = artifact_dir
        self.contamination = contamination
        self.model_version = "v1.0-IsolationForest"
        self.model = None
        self.pipeline = None
        self.feature_baselines = {}
        self.last_trained_at = None
        self.is_loaded = False

    def fit(self, df_raw: pd.DataFrame) -> Dict[str, Any]:
        """
        Fits preprocessing pipeline and Isolation Forest model on raw training telemetry.
        """
        os.makedirs(self.artifact_dir, exist_ok=True)

        self.pipeline = IndustrialDataPipeline(window_size=5)
        df_feat, val_report = self.pipeline.fit_transform(df_raw)

        available_features = [c for c in self.FEATURE_COLS if c in df_feat.columns]
        if not available_features:
            raise ValueError("No matching features available for model training.")

        X = df_feat[available_features].fillna(0.0)

        # Calculate feature baseline statistics for importance attribution
        self.feature_baselines = {}
        for col in available_features:
            self.feature_baselines[col] = {
                "mean": float(X[col].mean()),
                "std": float(X[col].std() if X[col].std() > 0 else 1.0)
            }

        # Train IsolationForest model
        self.model = IsolationForest(
            n_estimators=100,
            contamination=self.contamination,
            random_state=42
        )
        self.model.fit(X)

        self.last_trained_at = pd.Timestamp.now().isoformat()
        self.is_loaded = True

        # Save artifacts
        self.save_artifacts()

        return {
            "status": "SUCCESS",
            "modelVersion": self.model_version,
            "trainedSamples": len(X),
            "contamination": self.contamination,
            "featuresUsed": available_features,
            "lastTrainedAt": self.last_trained_at
        }

    def save_artifacts(self):
        """Serializes model weights and configuration metadata to disk."""
        os.makedirs(self.artifact_dir, exist_ok=True)
        
        model_path = os.path.join(self.artifact_dir, "isolation_forest.joblib")
        config_path = os.path.join(self.artifact_dir, "anomaly_config.json")
        pipeline_path = os.path.join(self.artifact_dir, "preprocessor_config.json")

        joblib.dump(self.model, model_path)
        self.pipeline.save(pipeline_path)

        metadata = {
            "modelVersion": self.model_version,
            "contamination": self.contamination,
            "featureBaselines": self.feature_baselines,
            "lastTrainedAt": self.last_trained_at
        }

        with open(config_path, "w") as f:
            json.dump(metadata, f, indent=2)

    def load_artifacts(self) -> bool:
        """Loads serialized Isolation Forest model and preprocessing configs from disk."""
        model_path = os.path.join(self.artifact_dir, "isolation_forest.joblib")
        config_path = os.path.join(self.artifact_dir, "anomaly_config.json")
        pipeline_path = os.path.join(self.artifact_dir, "preprocessor_config.json")

        if not os.path.exists(model_path) or not os.path.exists(config_path):
            self.is_loaded = False
            return False

        self.model = joblib.load(model_path)
        if os.path.exists(pipeline_path):
            self.pipeline = IndustrialDataPipeline.load(pipeline_path)
        else:
            self.pipeline = IndustrialDataPipeline(window_size=5)

        with open(config_path, "r") as f:
            metadata = json.load(f)

        self.model_version = metadata.get("modelVersion", "v1.0-IsolationForest")
        self.contamination = metadata.get("contamination", 0.10)
        self.feature_baselines = metadata.get("featureBaselines", {})
        self.last_trained_at = metadata.get("lastTrainedAt", None)

        self.is_loaded = True
        return True

    def predict(self, telemetry_readings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Executes real-time inference on input telemetry payload.
        Calculates normalized anomaly score, status classification, and feature attribution.
        """
        if not self.is_loaded or self.model is None:
            loaded = self.load_artifacts()
            if not loaded:
                df_temp = pd.DataFrame(telemetry_readings)
                self.fit(df_temp)

        if not telemetry_readings:
            return {
                "machineId": "UNKNOWN",
                "timestamp": pd.Timestamp.now().isoformat(),
                "anomalyScore": 0.0,
                "status": "NORMAL",
                "importantFeatures": [],
                "modelVersion": self.model_version
            }

        df_raw = pd.DataFrame(telemetry_readings)
        df_feat, val_report = self.pipeline.transform(df_raw)

        available_features = [c for c in self.FEATURE_COLS if c in df_feat.columns]
        if not available_features:
            available_features = [c for c in df_feat.columns if np.issubdtype(df_feat[c].dtype, np.number)]

        X = df_feat[available_features].fillna(0.0)
        latest_sample = X.tail(1)

        # 1. Isolation Forest Decision Function Score
        # decision_function > 0 implies nominal inlier; < 0 implies anomalous outlier
        decision_score = float(self.model.decision_function(latest_sample)[0])

        # 2. Normalize Anomaly Score to [0.0, 1.0]
        if decision_score >= 0.0:
            # Nominal inlier: score between 0.0 and 0.35
            normalized_score = max(0.02, round(0.30 - (decision_score * 1.5), 4))
        else:
            # Anomalous outlier: score between 0.40 and 1.00
            normalized_score = min(0.99, round(0.50 + (abs(decision_score) * 2.5), 4))

        # 3. Status Classification
        if normalized_score >= 0.70:
            status = "ANOMALOUS"
        elif normalized_score >= 0.40:
            status = "WARNING"
        else:
            status = "NORMAL"

        # 4. Feature Attribution (Important Features)
        important_features = self._calculate_important_features(latest_sample.iloc[0], available_features)

        machine_id = "UNKNOWN"
        for col in ["machineId", "machine_code", "machine_id"]:
            if col in df_raw.columns:
                machine_id = str(df_raw.iloc[-1][col])
                break

        timestamp_val = pd.Timestamp.now().isoformat()
        if "timestamp" in df_raw.columns and not pd.isna(df_raw.iloc[-1]["timestamp"]):
            timestamp_val = str(df_raw.iloc[-1]["timestamp"])

        return {
            "machineId": machine_id,
            "timestamp": timestamp_val,
            "anomalyScore": normalized_score,
            "status": status,
            "importantFeatures": important_features,
            "modelVersion": self.model_version
        }

    def _calculate_important_features(self, sample_row: pd.Series, feature_cols: List[str]) -> List[Dict[str, Any]]:
        """
        Identifies top features contributing to anomaly based on normalized Z-score deviation.
        """
        deviations = []
        for col in feature_cols:
            val = float(sample_row[col])
            baseline = self.feature_baselines.get(col, {"mean": 0.0, "std": 1.0})
            mean = baseline.get("mean", 0.0)
            std = baseline.get("std", 1.0)

            z_score = abs(val - mean) / (std + 1e-5)
            deviations.append((col, z_score))

        deviations.sort(key=lambda x: x[1], reverse=True)
        total_dev = sum(d[1] for d in deviations) + 1e-5

        top_features = []
        for col, dev in deviations[:3]:
            weight = round(float(dev / total_dev), 3)
            top_features.append({"feature": col, "score": weight})

        return top_features
