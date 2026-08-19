import pandas as pd
import numpy as np
from typing import Dict, List, Any

class IndustrialFeatureEngineer:
    """
    Feature Engineering module calculating rolling statistics, trend slopes,
    and pairwise sensor correlations across telemetry streams.
    """
    def __init__(self, window_size: int = 5):
        self.window_size = window_size

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Engineers rolling statistics and trend features per machine.
        """
        df = df.copy()
        machine_cols = [c for c in ["machineId", "machine_code", "machine_id"] if c in df.columns]

        if machine_cols:
            group_col = machine_cols[0]
            # Process rolling features grouped by machine
            processed_dfs = []
            for _, group in df.groupby(group_col, group_keys=False):
                processed_dfs.append(self._engineer_single_group(group))
            return pd.concat(processed_dfs, axis=0).reset_index(drop=True)
        else:
            return self._engineer_single_group(df)

    def _engineer_single_group(self, group: pd.DataFrame) -> pd.DataFrame:
        group = group.copy()
        w = self.window_size

        # 1. Temperature Features (mean, std, trend)
        if "temperature" in group.columns:
            group["temperature_mean"] = group["temperature"].rolling(window=w, min_periods=1).mean()
            group["temperature_std"] = group["temperature"].rolling(window=w, min_periods=1).std().fillna(0.0)
            group["temperature_trend"] = self._calculate_trend(group["temperature"], w)

        # 2. Vibration Features (mean, std, trend)
        if "vibration" in group.columns:
            group["vibration_mean"] = group["vibration"].rolling(window=w, min_periods=1).mean()
            group["vibration_std"] = group["vibration"].rolling(window=w, min_periods=1).std().fillna(0.0)
            group["vibration_trend"] = self._calculate_trend(group["vibration"], w)

        # 3. Pressure Features (mean, std)
        if "pressure" in group.columns:
            group["pressure_mean"] = group["pressure"].rolling(window=w, min_periods=1).mean()
            group["pressure_std"] = group["pressure"].rolling(window=w, min_periods=1).std().fillna(0.0)

        # 4. RPM Features (mean, trend)
        if "rpm" in group.columns:
            group["rpm_mean"] = group["rpm"].rolling(window=w, min_periods=1).mean()
            group["rpm_trend"] = self._calculate_trend(group["rpm"], w)

        # 5. Current Features (mean, trend)
        if "current" in group.columns:
            group["current_mean"] = group["current"].rolling(window=w, min_periods=1).mean()
            group["current_trend"] = self._calculate_trend(group["current"], w)

        return group

    def _calculate_trend(self, series: pd.Series, window: int) -> pd.Series:
        """
        Calculates linear trend (slope) over rolling window: (val_t - val_{t-window}) / window
        """
        diff = series.diff(periods=window - 1)
        trend = diff / float(window)
        return trend.fillna(0.0)

    @staticmethod
    def compute_sensor_correlation(df: pd.DataFrame, sensor_columns: List[str] = None) -> Dict[str, Dict[str, float]]:
        """
        Computes pairwise Pearson correlation matrix across sensor streams.
        """
        if sensor_columns is None:
            sensor_columns = ["temperature", "vibration", "pressure", "rpm", "current", "voltage"]

        available_cols = [c for c in sensor_columns if c in df.columns]
        if not available_cols:
            return {}

        corr_df = df[available_cols].corr(method='pearson').fillna(0.0)
        return corr_df.to_dict()
