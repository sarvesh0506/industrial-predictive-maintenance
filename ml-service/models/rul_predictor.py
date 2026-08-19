import os
import sys
import json
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from preprocessing.pipeline import IndustrialDataPipeline

class RulPredictor:
    """
    Remaining Useful Life (RUL) Regression & Confidence Engine.
    Engineers degradation features (vibration_trend, temperature_trend, current_trend,
    pressure_instability, rpm_degradation), trains a RandomForestRegressor, evaluates
    MAE, RMSE, and R2 metrics, and predicts estimated remaining operating hours.
    """
    RUL_FEATURE_COLS = [
        "vibration_trend",
        "temperature_trend",
        "current_trend",
        "pressure_instability",
        "rpm_degradation"
    ]

    def __init__(self, artifact_dir: str = "models"):
        self.artifact_dir = artifact_dir
        self.model_version = "v1.0-RandomForestRULRegressor"
        self.model = None
        self.pipeline = None
        self.evaluation_report = {}
        self.is_loaded = False

    def train_and_evaluate(self, df_raw: pd.DataFrame) -> Dict[str, Any]:
        """
        Fits preprocessing pipeline, extracts degradation features, fits RandomForestRegressor,
        evaluates MAE, RMSE, and R2 metrics, and saves serialized artifacts to disk.
        """
        os.makedirs(self.artifact_dir, exist_ok=True)

        self.pipeline = IndustrialDataPipeline(window_size=5)
        df_feat, val_report = self.pipeline.fit_transform(df_raw)

        # Build degradation features
        df_feat = self._extract_degradation_features(df_feat)
        
        X = df_feat[self.RUL_FEATURE_COLS].fillna(0.0)

        # Generate target synthetic target RUL in hours (500h down to 10h based on degradation intensity)
        if "rul_target" in df_feat.columns:
            y = df_feat["rul_target"].values
        else:
            y = self._calculate_synthetic_rul_targets(df_feat)

        # Train / Test Split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.25, random_state=42
        )

        # Train RandomForestRegressor
        self.model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
        self.model.fit(X_train, y_train)

        y_pred = self.model.predict(X_test)

        mae = float(mean_absolute_error(y_test, y_pred))
        mse = mean_squared_error(y_test, y_pred)
        rmse = float(np.sqrt(mse))
        r2 = float(r2_score(y_test, y_pred))

        self.evaluation_report = {
            "modelVersion": self.model_version,
            "metrics": {
                "MAE": round(mae, 4),
                "RMSE": round(rmse, 4),
                "R2": round(max(-1.0, r2), 4)
            },
            "featuresUsed": self.RUL_FEATURE_COLS,
            "trainedSamples": len(X),
            "evaluatedAt": pd.Timestamp.now().isoformat()
        }

        self.is_loaded = True
        self.save_artifacts()
        return self.evaluation_report

    def save_artifacts(self):
        """Saves regression model and evaluation report to disk."""
        os.makedirs(self.artifact_dir, exist_ok=True)

        model_path = os.path.join(self.artifact_dir, "rul_regressor.joblib")
        report_path = os.path.join(self.artifact_dir, "rul_evaluation_report.json")
        pipeline_path = os.path.join(self.artifact_dir, "preprocessor_config.json")

        joblib.dump(self.model, model_path)
        self.pipeline.save(pipeline_path)

        with open(report_path, "w") as f:
            json.dump(self.evaluation_report, f, indent=2)

    def load_artifacts(self) -> bool:
        """Loads regression model weights and preprocessor from disk."""
        model_path = os.path.join(self.artifact_dir, "rul_regressor.joblib")
        report_path = os.path.join(self.artifact_dir, "rul_evaluation_report.json")
        pipeline_path = os.path.join(self.artifact_dir, "preprocessor_config.json")

        if not os.path.exists(model_path) or not os.path.exists(report_path):
            self.is_loaded = False
            return False

        self.model = joblib.load(model_path)
        if os.path.exists(pipeline_path):
            self.pipeline = IndustrialDataPipeline.load(pipeline_path)
        else:
            self.pipeline = IndustrialDataPipeline(window_size=5)

        with open(report_path, "r") as f:
            self.evaluation_report = json.load(f)

        self.model_version = self.evaluation_report.get("modelVersion", "v1.0-RandomForestRULRegressor")
        self.is_loaded = True
        return True

    def predict(self, telemetry_readings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Predicts estimated remaining operating hours (RUL) and confidence score.
        """
        if not self.is_loaded or self.model is None:
            loaded = self.load_artifacts()
            if not loaded:
                # Generate synthetic batch if no pre-trained model on disk
                from training.generate_failure_dataset import generate_synthetic_failure_dataset
                df_synth = generate_synthetic_failure_dataset(samples_per_class=60)
                self.train_and_evaluate(df_synth)

        if not telemetry_readings:
            return {
                "machineId": "UNKNOWN",
                "estimatedRemainingHours": 420.0,
                "confidenceOrUncertainty": 0.95,
                "timestamp": pd.Timestamp.now().isoformat(),
                "modelVersion": self.model_version,
                "disclaimer": "AI estimate based on telemetry trends. Does not guarantee exact physical failure time."
            }

        df_raw = pd.DataFrame(telemetry_readings)
        df_feat, val_report = self.pipeline.transform(df_raw)

        df_feat = self._extract_degradation_features(df_feat)
        X = df_feat[self.RUL_FEATURE_COLS].fillna(0.0).tail(1)

        # 1. Predict RUL in Hours
        predicted_rul = float(self.model.predict(X)[0])
        predicted_rul = max(10.0, round(predicted_rul, 1))

        # 2. Estimate Model Prediction Confidence (based on tree variance)
        tree_preds = [tree.predict(X)[0] for tree in self.model.estimators_]
        variance = float(np.var(tree_preds))
        confidence = max(0.60, min(0.99, round(1.0 - (variance / (predicted_rul * 10.0 + 1.0)), 2)))

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
            "estimatedRemainingHours": predicted_rul,
            "confidenceOrUncertainty": confidence,
            "timestamp": timestamp_val,
            "modelVersion": self.model_version,
            "disclaimer": "AI estimate based on telemetry trends. Does not guarantee exact physical failure time."
        }

    def _extract_degradation_features(self, df_feat: pd.DataFrame) -> pd.DataFrame:
        df = df_feat.copy()

        # vibration_trend
        if "vibration_trend" not in df.columns:
            if "vibration" in df.columns:
                df["vibration_trend"] = df["vibration"].diff(5).fillna(0.0) / 5.0
            else:
                df["vibration_trend"] = 0.0

        # temperature_trend
        if "temperature_trend" not in df.columns:
            if "temperature" in df.columns:
                df["temperature_trend"] = df["temperature"].diff(5).fillna(0.0) / 5.0
            else:
                df["temperature_trend"] = 0.0

        # current_trend
        if "current_trend" not in df.columns:
            if "current" in df.columns:
                df["current_trend"] = df["current"].diff(5).fillna(0.0) / 5.0
            else:
                df["current_trend"] = 0.0

        # pressure_instability (rolling std of pressure)
        if "pressure_instability" not in df.columns:
            if "pressure_std" in df.columns:
                df["pressure_instability"] = df["pressure_std"]
            elif "pressure" in df.columns:
                df["pressure_instability"] = df["pressure"].rolling(window=5, min_periods=1).std().fillna(0.0)
            else:
                df["pressure_instability"] = 0.0

        # rpm_degradation (drop from 3000 RPM)
        if "rpm_degradation" not in df.columns:
            if "rpm_mean" in df.columns:
                df["rpm_degradation"] = np.maximum(0.0, 3000.0 - df["rpm_mean"])
            elif "rpm" in df.columns:
                df["rpm_degradation"] = np.maximum(0.0, 3000.0 - df["rpm"])
            else:
                df["rpm_degradation"] = 0.0

        return df

    def _calculate_synthetic_rul_targets(self, df_feat: pd.DataFrame) -> np.ndarray:
        """
        Calculates target RUL hours based on degradation feature intensities.
        Baseline: 500 hours down to 10 hours for high degradation.
        """
        baseline_rul = 500.0
        ruls = []

        for idx, row in df_feat.iterrows():
            vib_t = float(row.get("vibration_trend", 0.0))
            temp_t = float(row.get("temperature_trend", 0.0))
            curr_t = float(row.get("current_trend", 0.0))
            rpm_d = float(row.get("rpm_degradation", 0.0))

            degradation_score = (vib_t * 50.0) + (temp_t * 15.0) + (curr_t * 20.0) + (rpm_d * 0.2)
            estimated_rul = max(10.0, baseline_rul - (degradation_score * 8.0))
            ruls.append(estimated_rul)

        return np.array(ruls)
