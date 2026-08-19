import json
import pandas as pd
from typing import Union, List, Dict, Any

class TelemetryDataLoader:
    """
    Data Loader module for loading, parsing, and normalizing raw industrial
    telemetry data from pandas DataFrames, JSON payloads, or CSV files.
    """
    @staticmethod
    def load_from_dict_list(data: List[Dict[str, Any]]) -> pd.DataFrame:
        if not data:
            return pd.DataFrame()
        df = pd.DataFrame(data)
        return TelemetryDataLoader._normalize_timestamps(df)

    @staticmethod
    def load_from_json(json_str: str) -> pd.DataFrame:
        parsed = json.loads(json_str)
        if isinstance(parsed, list):
            df = pd.DataFrame(parsed)
        elif isinstance(parsed, dict):
            if "sensors" in parsed:
                df = pd.DataFrame(parsed["sensors"])
            else:
                df = pd.DataFrame([parsed])
        else:
            raise ValueError("Unsupported JSON format for telemetry loading.")
        return TelemetryDataLoader._normalize_timestamps(df)

    @staticmethod
    def load_from_csv(filepath: str) -> pd.DataFrame:
        df = pd.read_csv(filepath)
        return TelemetryDataLoader._normalize_timestamps(df)

    @staticmethod
    def _normalize_timestamps(df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        time_cols = [c for c in ["timestamp", "time", "created_at"] if c in df.columns]
        if time_cols:
            t_col = time_cols[0]
            df[t_col] = pd.to_datetime(df[t_col], errors='coerce', utc=True)
            if t_col != "timestamp":
                df.rename(columns={t_col: "timestamp"}, inplace=True)
        
        # Sort chronologically by machineId / machine_code and timestamp if present
        machine_cols = [c for c in ["machineId", "machine_code", "machine_id"] if c in df.columns]
        sort_by = []
        if machine_cols:
            sort_by.append(machine_cols[0])
        if "timestamp" in df.columns:
            sort_by.append("timestamp")
            
        if sort_by:
            df.sort_values(by=sort_by, inplace=True)
            df.reset_index(drop=True, inplace=True)
            
        return df
