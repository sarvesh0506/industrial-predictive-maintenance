# Machine Learning Data Processing & Feature Engineering Pipeline

The **ML Data Processing Pipeline** (`ml-service/preprocessing/`) transforms raw industrial IoT sensor streams into structured, cleaned, and feature-engineered datasets for Anomaly Detection (IsolationForest) and Remaining Useful Life (RUL) estimation.

---

## Modular Architecture (`ml-service/`)

```text
ml-service/
├── app/
│   └── main.py              # FastAPI microservice endpoints (/health, /predict)
├── models/                  # Preprocessor configurations & serialized model artifacts
├── preprocessing/           # Modular preprocessing components
│   ├── data_loader.py       # Data loading & timestamp normalization
│   ├── validator.py         # Schema validation & physical bound checks
│   ├── cleaner.py           # Imputation & IQR outlier clipping
│   ├── feature_engineer.py  # Rolling statistics, trends & sensor correlation
│   └── pipeline.py          # Unified IndustrialDataPipeline orchestrator
├── training/
│   └── train.py             # Model training script
├── inference/
│   └── predict.py           # Inference engine
└── tests/
    └── test_preprocessing.py # Pytest unit & integration test suite
```

---

## Data Pipeline Stages

### 1. Data Loading & Timestamp Normalization (`TelemetryDataLoader`)
- Loads telemetry from DataFrames, JSON payloads, or CSV files.
- Converts timestamps to UTC ISO format (`datetime64[ns, UTC]`).
- Sorts telemetry chronologically per machine asset (`machineId`, `timestamp`).

### 2. Validation & Boundary Enforcement (`TelemetryValidator`)
- Enforces mandatory column presence.
- Verifies physical bounds:
  - `temperature`: $0.0 \text{ to } 200.0\,^\circ\text{C}$
  - `vibration`: $0.0 \text{ to } 100.0\,\text{mm/s}$
  - `pressure`: $0.0 \text{ to } 50.0\,\text{bar}$
  - `rpm`: $0.0 \text{ to } 15000.0\,\text{RPM}$
  - `current`: $0.0 \text{ to } 300.0\,\text{A}$
  - `voltage`: $0.0 \text{ to } 1000.0\,\text{V}$

### 3. Missing-Value Imputation & Outlier Clipping (`TelemetryCleaner`)
- **Missing Values**: Imputes missing values via forward fill (`ffill`), backward fill (`bfill`), and fitted column medians.
- **Outlier Clipping**: Trims extreme sensor anomalies using Interquartile Range bounds ($[Q_1 - 1.5 \times \text{IQR},\, Q_3 + 1.5 \times \text{IQR}]$).

### 4. Feature Engineering (`IndustrialFeatureEngineer`)
Generates 12 rolling statistical and trend features per machine over a configurable window ($w = 5$):
- `temperature_mean`: Rolling mean temperature
- `temperature_std`: Rolling standard deviation of temperature
- `temperature_trend`: Rate of change ($\Delta T / \Delta t$)
- `vibration_mean`: Rolling mean vibration
- `vibration_std`: Rolling standard deviation of vibration
- `vibration_trend`: Rate of change ($\Delta v / \Delta t$)
- `pressure_mean`: Rolling mean hydraulic/pneumatic pressure
- `pressure_std`: Rolling standard deviation of pressure
- `rpm_mean`: Rolling mean motor speed
- `rpm_trend`: Rate of change ($\Delta \Omega / \Delta t$)
- `current_mean`: Rolling mean current draw
- `current_trend`: Rate of change ($\Delta I / \Delta t$)
- **Sensor Correlation Matrix**: Computes pairwise Pearson correlation across all telemetry channels.

---

## Pytest Execution

Run the preprocessing test suite:
```bash
python -m pytest ml-service/tests/test_preprocessing.py
```
**Test Results**:
```text
ml-service/tests/test_preprocessing.py ...... [100%]
6 passed in 1.14s
```
