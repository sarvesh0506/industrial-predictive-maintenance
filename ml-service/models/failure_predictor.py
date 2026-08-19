import os
import sys
import json
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.model_selection import train_test_split

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from preprocessing.pipeline import IndustrialDataPipeline

FAILURE_TYPE_MAP = {
    0: "NORMAL",
    1: "OVERHEATING",
    2: "BEARING_DEGRADATION",
    3: "PRESSURE_FAILURE",
    4: "MOTOR_DEGRADATION"
}

class MachineFailurePredictor:
    """
    Machine Failure Classification & Risk Assessment Engine.
    Compares candidate classifiers (RandomForest vs GradientBoosting),
    evaluates precision/recall/F1 metrics, and provides failure risk predictions.
    """
    FEATURE_COLS = [
        "temperature_mean", "temperature_std", "temperature_trend",
        "vibration_mean", "vibration_std", "vibration_trend",
        "pressure_mean", "pressure_std",
        "rpm_mean", "rpm_trend",
        "current_mean", "current_trend"
    ]

    def __init__(self, artifact_dir: str = "models"):
        self.artifact_dir = artifact_dir
        self.model_version = "v1.0-RandomForestFailureClassifier"
        self.model = None
        self.pipeline = None
        self.evaluation_report = {}
        self.is_loaded = False

    def train_and_evaluate(self, df_raw: pd.DataFrame) -> Dict[str, Any]:
        """
        Trains preprocessing pipeline, generates features, compares RandomForest
        vs GradientBoosting classifiers, evaluates metrics, and saves the best model.
        """
        os.makedirs(self.artifact_dir, exist_ok=True)

        if "failure_label" not in df_raw.columns:
            raise ValueError("Training dataset must contain 'failure_label' column.")

        # 1. Feature Preprocessing
        self.pipeline = IndustrialDataPipeline(window_size=5)
        df_feat, val_report = self.pipeline.fit_transform(df_raw)

        available_features = [c for c in self.FEATURE_COLS if c in df_feat.columns]
        if not available_features:
            raise ValueError("No matching features available for model training.")

        X = df_feat[available_features].fillna(0.0)
        y = df_feat["failure_label"].values

        # 2. Train / Test Split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.25, random_state=42, stratify=y if len(np.unique(y)) > 1 else None
        )

        # 3. Candidate Algorithm 1: RandomForestClassifier
        rf_model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
        rf_model.fit(X_train, y_train)
        rf_preds = rf_model.predict(X_test)

        rf_metrics = {
            "accuracy": float(accuracy_score(y_test, rf_preds)),
            "precision": float(precision_score(y_test, rf_preds, average='macro', zero_division=0)),
            "recall": float(recall_score(y_test, rf_preds, average='macro', zero_division=0)),
            "f1Score": float(f1_score(y_test, rf_preds, average='macro', zero_division=0)),
            "confusionMatrix": confusion_matrix(y_test, rf_preds).tolist()
        }

        # 4. Candidate Algorithm 2: GradientBoostingClassifier
        gb_model = GradientBoostingClassifier(n_estimators=80, learning_rate=0.1, random_state=42)
        gb_model.fit(X_train, y_train)
        gb_preds = gb_model.predict(X_test)

        gb_metrics = {
            "accuracy": float(accuracy_score(y_test, gb_preds)),
            "precision": float(precision_score(y_test, gb_preds, average='macro', zero_division=0)),
            "recall": float(recall_score(y_test, gb_preds, average='macro', zero_division=0)),
            "f1Score": float(f1_score(y_test, gb_preds, average='macro', zero_division=0)),
            "confusionMatrix": confusion_matrix(y_test, gb_preds).tolist()
        }

        # 5. Model Selection (Choose algorithm with higher F1 score)
        if gb_metrics["f1Score"] > rf_metrics["f1Score"]:
            self.model = gb_model
            chosen_algorithm = "GradientBoostingClassifier"
            best_metrics = gb_metrics
        else:
            self.model = rf_model
            chosen_algorithm = "RandomForestClassifier"
            best_metrics = rf_metrics

        self.model_version = f"v1.0-{chosen_algorithm}"
        self.evaluation_report = {
            "chosenAlgorithm": chosen_algorithm,
            "modelVersion": self.model_version,
            "metrics": best_metrics,
            "candidateComparison": {
                "RandomForestClassifier": rf_metrics,
                "GradientBoostingClassifier": gb_metrics
            },
            "featuresUsed": available_features,
            "trainedSamples": len(X),
            "classDistribution": pd.Series(y).value_counts().to_dict(),
            "evaluatedAt": pd.Timestamp.now().isoformat()
        }

        self.is_loaded = True
        self.save_artifacts()
        return self.evaluation_report

    def save_artifacts(self):
        """Saves model weights and evaluation report JSON to disk."""
        os.makedirs(self.artifact_dir, exist_ok=True)
        
        model_path = os.path.join(self.artifact_dir, "failure_classifier.joblib")
        report_path = os.path.join(self.artifact_dir, "failure_evaluation_report.json")
        pipeline_path = os.path.join(self.artifact_dir, "preprocessor_config.json")

        joblib.dump(self.model, model_path)
        self.pipeline.save(pipeline_path)

        with open(report_path, "w") as f:
            json.dump(self.evaluation_report, f, indent=2)

    def load_artifacts(self) -> bool:
        """Loads failure classifier and evaluation report from disk."""
        model_path = os.path.join(self.artifact_dir, "failure_classifier.joblib")
        report_path = os.path.join(self.artifact_dir, "failure_evaluation_report.json")
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

        self.model_version = self.evaluation_report.get("modelVersion", "v1.0-FailureClassifier")
        self.is_loaded = True
        return True

    def predict(self, telemetry_readings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Predicts machine failure probability, failure mode, risk level, and important features.
        """
        if not self.is_loaded or self.model is None:
            loaded = self.load_artifacts()
            if not loaded:
                # Generate synthetic training set if no pre-trained model on disk
                from training.generate_failure_dataset import generate_synthetic_failure_dataset
                df_synth = generate_synthetic_failure_dataset(samples_per_class=80)
                self.train_and_evaluate(df_synth)

        if not telemetry_readings:
            return {
                "machineId": "UNKNOWN",
                "failureProbability": 0.05,
                "riskLevel": "LOW",
                "predictedFailureType": "NORMAL",
                "importantFeatures": [],
                "timestamp": pd.Timestamp.now().isoformat(),
                "modelVersion": self.model_version,
                "disclaimer": "Predictions are probabilistic estimates based on telemetry trends and do not guarantee physical machine outcomes."
            }

        df_raw = pd.DataFrame(telemetry_readings)
        df_feat, val_report = self.pipeline.transform(df_raw)

        available_features = [c for c in self.FEATURE_COLS if c in df_feat.columns]
        if not available_features:
            available_features = [c for c in df_feat.columns if np.issubdtype(df_feat[c].dtype, np.number)]

        X = df_feat[available_features].fillna(0.0)
        latest_sample = X.tail(1)

        # 1. Predict Class Probabilities
        probs = self.model.predict_proba(latest_sample)[0]
        predicted_class_id = int(np.argmax(probs))
        predicted_failure_type = FAILURE_TYPE_MAP.get(predicted_class_id, "UNKNOWN")

        # Failure probability is 1.0 - P(NORMAL)
        normal_idx = 0
        if 0 in self.model.classes_:
            normal_idx = list(self.model.classes_).index(0)

        failure_probability = round(float(1.0 - probs[normal_idx]), 4)

        # 2. Risk Level Assignment
        if failure_probability >= 0.80:
            risk_level = "CRITICAL"
        elif failure_probability >= 0.55:
            risk_level = "HIGH"
        elif failure_probability >= 0.25:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # 3. Feature Importance Attribution
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
            "failureProbability": failure_probability,
            "riskLevel": risk_level,
            "predictedFailureType": predicted_failure_type,
            "importantFeatures": important_features,
            "timestamp": timestamp_val,
            "modelVersion": self.model_version,
            "disclaimer": "Predictions are probabilistic estimates based on telemetry trends and do not guarantee physical machine outcomes."
        }

    def _calculate_important_features(self, sample_row: pd.Series, feature_cols: List[str]) -> List[Dict[str, Any]]:
        """
        Extracts feature importances weighted by model tree split importances.
        """
        importances = getattr(self.model, "feature_importances_", None)
        if importances is None or len(importances) != len(feature_cols):
            importances = [1.0 / len(feature_cols)] * len(feature_cols)

        feature_scores = []
        for col, imp in zip(feature_cols, importances):
            val = float(sample_row[col])
            score = round(float(imp * abs(val)), 3)
            feature_scores.append((col, score))

        feature_scores.sort(key=lambda x: x[1], reverse=True)
        total = sum(s[1] for s in feature_scores) + 1e-5

        top_features = []
        for col, score in feature_scores[:3]:
            top_features.append({"feature": col, "score": round(float(score / total), 3)})

        return top_features
