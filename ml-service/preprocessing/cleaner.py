import pandas as pd
import numpy as np
from typing import List

class TelemetryCleaner:
    """
    Data Cleaner for missing value imputation and outlier clipping/trimming.
    """
    def __init__(self, imputation_strategy: str = "ffill_median", iqr_factor: float = 1.5):
        self.imputation_strategy = imputation_strategy
        self.iqr_factor = iqr_factor
        self.medians = {}

    def fit_imputers(self, df: pd.DataFrame, numeric_columns: List[str]):
        """Fits column medians for inference imputation."""
        for col in numeric_columns:
            if col in df.columns:
                self.medians[col] = df[col].median()

    def handle_missing_values(self, df: pd.DataFrame, numeric_columns: List[str]) -> pd.DataFrame:
        """Imputes missing values using forward fill, backward fill, and fitted median fallbacks."""
        df = df.copy()
        for col in numeric_columns:
            if col in df.columns:
                # Forward fill then backward fill per group if possible
                df[col] = df[col].ffill().bfill()
                # Fallback to column median if still missing
                if col in self.medians and not pd.isna(self.medians[col]):
                    df[col] = df[col].fillna(self.medians[col])
                else:
                    df[col] = df[col].fillna(df[col].median() if not df[col].empty else 0.0)
        return df

    def clip_outliers_iqr(self, df: pd.DataFrame, numeric_columns: List[str]) -> pd.DataFrame:
        """Clips extreme numerical outliers using Interquartile Range (IQR) bounds."""
        df = df.copy()
        for col in numeric_columns:
            if col in df.columns and not df[col].dropna().empty:
                q1 = df[col].quantile(0.25)
                q3 = df[col].quantile(0.75)
                iqr = q3 - q1
                if iqr > 0:
                    lower_bound = q1 - (self.iqr_factor * iqr)
                    upper_bound = q3 + (self.iqr_factor * iqr)
                    df[col] = np.clip(df[col], lower_bound, upper_bound)
        return df
