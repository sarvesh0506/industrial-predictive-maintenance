"""
SYNTHETIC TELEMETRY DATASET GENERATOR FOR MACHINE FAILURE PREDICTION

DISCLAIMER & DOCUMENTATION:
This module generates a SYNTHETIC industrial telemetry dataset designed for ML model
training and algorithmic evaluation. The dataset simulates physics-based degradation
patterns modeled after the industrial IoT simulator failure scenarios:
  - Class 0: NORMAL (Baseline operational noise and load fluctuations)
  - Class 1: OVERHEATING (Thermal ramp and high temperature mean/trend)
  - Class 2: BEARING_DEGRADATION (High vibration amplitude and trend)
  - Class 3: PRESSURE_FAILURE (Hydraulic instability and pressure fluctuation)
  - Class 4: MOTOR_DEGRADATION (Current surge and RPM drop)

NOTE: This dataset is synthetic and should NEVER be presented as real industrial plant data.
"""

import pandas as pd
import numpy as np
from typing import Tuple

FAILURE_LABELS = {
    0: "NORMAL",
    1: "OVERHEATING",
    2: "BEARING_DEGRADATION",
    3: "PRESSURE_FAILURE",
    4: "MOTOR_DEGRADATION"
}

def generate_synthetic_failure_dataset(samples_per_class: int = 150, seed: int = 42) -> pd.DataFrame:
    """
    Generates a balanced synthetic telemetry dataset across 5 failure scenario classes.
    """
    np.random.seed(seed)
    records = []
    
    machines = [f"MCH-SYNTH-{i:03d}" for i in range(1, 11)]

    for class_id, class_name in FAILURE_LABELS.items():
        for i in range(samples_per_class):
            m_code = np.random.choice(machines)
            now = pd.Timestamp.now() - pd.Timedelta(minutes=(samples_per_class * 5) - i * 5)

            # Default Nominal Baseline
            temp = np.random.normal(62.0, 1.5)
            vib = np.random.normal(1.8, 0.2)
            pres = np.random.normal(5.0, 0.1)
            rpm = np.random.normal(3000.0, 15.0)
            curr = np.random.normal(12.0, 0.3)
            volt = np.random.normal(400.0, 1.0)

            # Apply Physics Failure Mode Shifts
            if class_id == 1:  # OVERHEATING
                temp += np.random.uniform(25.0, 50.0)
                curr += np.random.uniform(2.0, 6.0)
            elif class_id == 2:  # BEARING_DEGRADATION
                vib += np.random.uniform(8.0, 22.0)
                temp += np.random.uniform(5.0, 15.0)
            elif class_id == 3:  # PRESSURE_FAILURE
                pres += np.random.choice([-1.0, 1.0]) * np.random.uniform(2.5, 6.0)
                vib += np.random.uniform(1.5, 4.0)
            elif class_id == 4:  # MOTOR_DEGRADATION
                curr += np.random.uniform(10.0, 25.0)
                rpm -= np.random.uniform(400.0, 1200.0)
                temp += np.random.uniform(10.0, 20.0)

            records.append({
                "machineId": m_code,
                "timestamp": now.isoformat(),
                "temperature": max(10.0, temp),
                "vibration": max(0.1, vib),
                "pressure": max(0.1, pres),
                "rpm": max(100.0, rpm),
                "current": max(0.5, curr),
                "voltage": max(200.0, volt),
                "failure_label": class_id,
                "failure_type": class_name,
                "is_synthetic": True
            })

    df = pd.DataFrame(records)
    return df

if __name__ == "__main__":
    df_synth = generate_synthetic_failure_dataset(samples_per_class=100)
    print("Generated Synthetic Failure Dataset:")
    print("Shape:", df_synth.shape)
    print("Class Distribution:\n", df_synth["failure_type"].value_counts())
