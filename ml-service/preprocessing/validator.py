import pandas as pd
from typing import Dict, List, Tuple, Any

class TelemetryValidator:
    """
    Data Validator for enforcing schema constraints, non-null timestamps,
    and physical plausibility ranges for industrial sensor streams.
    """
    PHYSICAL_BOUNDS = {
        "temperature": (0.0, 200.0),    # °C
        "vibration": (0.0, 100.0),      # mm/s
        "pressure": (0.0, 50.0),        # bar
        "rpm": (0.0, 15000.0),          # RPM
        "current": (0.0, 300.0),        # Amperes
        "voltage": (0.0, 1000.0)        # Volts
    }

    @staticmethod
    def validate(df: pd.DataFrame, required_columns: List[str] = None) -> Tuple[bool, Dict[str, Any]]:
        report = {
            "valid": True,
            "errors": [],
            "warnings": [],
            "total_rows": len(df)
        }

        if df.empty:
            report["valid"] = False
            report["errors"].append("DataFrame is empty.")
            return False, report

        # 1. Required Columns Check
        if required_columns:
            missing = [col for col in required_columns if col not in df.columns]
            if missing:
                report["valid"] = False
                report["errors"].append(f"Missing required columns: {missing}")

        # 2. Timestamp Non-null Check
        if "timestamp" in df.columns:
            null_timestamps = df["timestamp"].isnull().sum()
            if null_timestamps > 0:
                report["warnings"].append(f"Found {null_timestamps} null timestamps.")

        # 3. Physical Bounds Check
        for col, (min_b, max_b) in TelemetryValidator.PHYSICAL_BOUNDS.items():
            if col in df.columns:
                out_of_bounds = df[(df[col] < min_b) | (df[col] > max_b)]
                if len(out_of_bounds) > 0:
                    report["warnings"].append(
                        f"Column '{col}' has {len(out_of_bounds)} values outside physical bounds [{min_b}, {max_b}]."
                    )

        if report["errors"]:
            report["valid"] = False

        return report["valid"], report
