import os
import json
import joblib
import pandas as pd
from typing import Dict, Any, Tuple
from .data_loader import TelemetryDataLoader
from .validator import TelemetryValidator
from .cleaner import TelemetryCleaner
from .feature_engineer import IndustrialFeatureEngineer

class IndustrialDataPipeline:
    """
    Unified Industrial Data Preprocessing & Feature Engineering Pipeline.
    Encapsulates validation, missing value imputation, outlier clipping,
    rolling statistics, trend detection, and feature matrix export.
    """
    SENSOR_COLS = ["temperature", "vibration", "pressure", "rpm", "current", "voltage"]

    def __init__(self, window_size: int = 5, iqr_factor: float = 1.5):
        self.window_size = window_size
        self.iqr_factor = iqr_factor
        self.cleaner = TelemetryCleaner(iqr_factor=iqr_factor)
        self.feature_engineer = IndustrialFeatureEngineer(window_size=window_size)
        self.is_fitted = False

    def fit(self, df: pd.DataFrame):
        """Fits column medians and scaler baselines from training data."""
        self.cleaner.fit_imputers(df, self.SENSOR_COLS)
        self.is_fitted = True
        return self

    def transform(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Executes full preprocessing and feature engineering pipeline on input telemetry DataFrame.
        """
        # 1. Normalize timestamps & sorting
        df_norm = TelemetryDataLoader._normalize_timestamps(df)

        # 2. Validation
        is_valid, val_report = TelemetryValidator.validate(df_norm)

        # 3. Missing-value handling
        df_clean = self.cleaner.handle_missing_values(df_norm, self.SENSOR_COLS)

        # 4. Outlier clipping
        df_clipped = self.cleaner.clip_outliers_iqr(df_clean, self.SENSOR_COLS)

        # 5. Feature Engineering (Rolling statistics & trends)
        df_features = self.feature_engineer.transform(df_clipped)

        # 6. Sensor Correlation
        val_report["correlation_matrix"] = self.feature_engineer.compute_sensor_correlation(df_features)

        return df_features, val_report

    def fit_transform(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        return self.fit(df).transform(df)

    def save(self, filepath: str):
        """Saves pipeline parameters to disk."""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        config = {
            "window_size": self.window_size,
            "iqr_factor": self.iqr_factor,
            "cleaner_medians": self.cleaner.medians,
            "is_fitted": self.is_fitted
        }
        if filepath.endswith(".json"):
            with open(filepath, "w") as f:
                json.dump(config, f, indent=2)
        else:
            joblib.dump(config, filepath)

    @classmethod
    def load(cls, filepath: str) -> "IndustrialDataPipeline":
        """Loads pipeline configuration from disk."""
        if filepath.endswith(".json"):
            with open(filepath, "r") as f:
                config = json.load(f)
        else:
            config = joblib.load(filepath)

        pipeline = cls(window_size=config["window_size"], iqr_factor=config["iqr_factor"])
        pipeline.cleaner.medians = config.get("cleaner_medians", {})
        pipeline.is_fitted = config.get("is_fitted", True)
        return pipeline
