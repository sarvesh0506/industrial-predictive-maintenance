import os
import sys
import pytest
import pandas as pd
import numpy as np

# Ensure ml-service folder is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from preprocessing.data_loader import TelemetryDataLoader
from preprocessing.validator import TelemetryValidator
from preprocessing.cleaner import TelemetryCleaner
from preprocessing.feature_engineer import IndustrialFeatureEngineer
from preprocessing.pipeline import IndustrialDataPipeline

@pytest.fixture
def sample_telemetry_raw():
    return [
        {"machineId": "MCH-01", "timestamp": "2026-08-19T10:00:00Z", "temperature": 60.0, "vibration": 1.5, "pressure": 5.0, "rpm": 3000.0, "current": 12.0, "voltage": 400.0},
        {"machineId": "MCH-01", "timestamp": "2026-08-19T10:05:00Z", "temperature": 62.0, "vibration": 1.8, "pressure": 5.1, "rpm": 2980.0, "current": 12.5, "voltage": 399.0},
        {"machineId": "MCH-01", "timestamp": "2026-08-19T10:10:00Z", "temperature": 64.0, "vibration": 2.2, "pressure": np.nan, "rpm": 2950.0, "current": 13.2, "voltage": 401.0},
        {"machineId": "MCH-01", "timestamp": "2026-08-19T10:15:00Z", "temperature": 70.0, "vibration": 3.0, "pressure": 5.2, "rpm": 2900.0, "current": 14.5, "voltage": 400.0},
        {"machineId": "MCH-01", "timestamp": "2026-08-19T10:20:00Z", "temperature": 85.0, "vibration": 4.5, "pressure": 5.5, "rpm": 2800.0, "current": 16.0, "voltage": 398.0},
        {"machineId": "MCH-01", "timestamp": "2026-08-19T10:25:00Z", "temperature": 195.0, "vibration": 12.0, "pressure": 8.0, "rpm": 2500.0, "current": 25.0, "voltage": 402.0}
    ]

def test_data_loader(sample_telemetry_raw):
    df = TelemetryDataLoader.load_from_dict_list(sample_telemetry_raw)
    assert not df.empty
    assert len(df) == 6
    assert pd.api.types.is_datetime64_any_dtype(df["timestamp"])
    assert df["timestamp"].is_monotonic_increasing

def test_validator(sample_telemetry_raw):
    df = TelemetryDataLoader.load_from_dict_list(sample_telemetry_raw)
    is_valid, report = TelemetryValidator.validate(df, required_columns=["machineId", "temperature", "vibration"])
    assert is_valid is True
    assert report["total_rows"] == 6

def test_cleaner_imputation_and_outliers(sample_telemetry_raw):
    df = TelemetryDataLoader.load_from_dict_list(sample_telemetry_raw)
    cleaner = TelemetryCleaner(iqr_factor=1.5)
    
    # Test Imputation
    df_imputed = cleaner.handle_missing_values(df, ["temperature", "vibration", "pressure"])
    assert df_imputed["pressure"].isna().sum() == 0

    # Test Outlier Clipping
    df_clipped = cleaner.clip_outliers_iqr(df_imputed, ["temperature", "vibration"])
    assert df_clipped["temperature"].max() < 195.0

def test_feature_engineer_required_features(sample_telemetry_raw):
    df = TelemetryDataLoader.load_from_dict_list(sample_telemetry_raw)
    cleaner = TelemetryCleaner()
    df_clean = cleaner.handle_missing_values(df, ["temperature", "vibration", "pressure", "rpm", "current"])
    
    fe = IndustrialFeatureEngineer(window_size=3)
    df_feat = fe.transform(df_clean)

    # Required Features Check
    required_generated = [
        "temperature_mean", "temperature_std", "temperature_trend",
        "vibration_mean", "vibration_std", "vibration_trend",
        "pressure_mean", "pressure_std",
        "rpm_mean", "rpm_trend",
        "current_mean", "current_trend"
    ]

    for feat in required_generated:
        assert feat in df_feat.columns, f"Missing required engineered feature: {feat}"
        assert df_feat[feat].isna().sum() == 0

def test_sensor_correlation(sample_telemetry_raw):
    df = TelemetryDataLoader.load_from_dict_list(sample_telemetry_raw)
    cleaner = TelemetryCleaner()
    df_clean = cleaner.handle_missing_values(df, ["temperature", "vibration", "pressure"])
    
    corr_matrix = IndustrialFeatureEngineer.compute_sensor_correlation(df_clean)
    assert "temperature" in corr_matrix
    assert "vibration" in corr_matrix["temperature"]
    assert isinstance(corr_matrix["temperature"]["vibration"], float)

def test_industrial_data_pipeline(sample_telemetry_raw, tmp_path):
    df_raw = TelemetryDataLoader.load_from_dict_list(sample_telemetry_raw)
    pipeline = IndustrialDataPipeline(window_size=3)
    
    df_processed, report = pipeline.fit_transform(df_raw)
    assert not df_processed.empty
    assert "temperature_mean" in df_processed.columns
    assert "correlation_matrix" in report

    # Test Save & Load
    save_path = os.path.join(tmp_path, "pipeline_config.json")
    pipeline.save(save_path)
    assert os.path.exists(save_path)

    loaded_pipeline = IndustrialDataPipeline.load(save_path)
    assert loaded_pipeline.window_size == 3
    assert loaded_pipeline.is_fitted is True
