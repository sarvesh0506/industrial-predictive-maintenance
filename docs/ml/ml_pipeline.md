# Machine Learning Pipeline & Model Evaluation Architecture

The **AI / Machine Learning Subsystem** (`ml-service/`) provides real-time anomaly detection, failure mode classification, and Remaining Useful Life (RUL) estimation using scikit-learn ML algorithms.

---

## 1. Synthetic Telemetry Dataset & Scenarios

To ensure realistic evaluation without requiring proprietary physical IoT hardware, synthetic degradation streams are generated (`ml-service/training/generate_failure_dataset.py`) based on 5 industrial failure scenarios:

1. **Bearing Degradation**: Exponential increase in high-frequency vibration ($> 4.0\text{ mm/s}$) with thermal dissipation.
2. **Overheating**: Thermal runaway ($> 85.0^\circ\text{C}$) accompanied by elevated electrical current.
3. **Pressure Instability**: Abnormal pressure oscillations超出 $1.0 - 10.0\text{ bar}$ boundary.
4. **Motor Degradation**: Electrical current spike ($> 25.0\text{ A}$) paired with rotational RPM drop ($< 2500\text{ RPM}$).
5. **Combined Degradation**: Multi-sensor degradation across vibration, temperature, current, and pressure.

---

## 2. Feature Engineering Pipeline (`preprocessing/`)

High-frequency sensor streams are aggregated over rolling time windows into 12 engineered features:

| Feature Name | Description | Computation |
| :--- | :--- | :--- |
| `temperature_mean` | Average temperature | 10-step rolling mean |
| `temperature_std` | Temperature volatility | 10-step rolling std |
| `temperature_trend` | Temperature rate of change | Linear slope $\Delta T / \Delta t$ |
| `vibration_mean` | Average vibration | 10-step rolling mean |
| `vibration_std` | Vibration noise volatility | 10-step rolling std |
| `vibration_trend` | Vibration degradation trend | Linear slope $\Delta V / \Delta t$ |
| `pressure_mean` | Average pressure | 10-step rolling mean |
| `pressure_std` | Pressure instability variance | 10-step rolling std |
| `rpm_mean` | Average rotational RPM | 10-step rolling mean |
| `rpm_trend` | RPM drop degradation rate | Linear slope $\Delta RPM / \Delta t$ |
| `current_mean` | Average motor current | 10-step rolling mean |
| `current_trend` | Current surge rate | Linear slope $\Delta I / \Delta t$ |

---

## 3. Anomaly Detection Engine (Isolation Forest)

- **Algorithm**: `sklearn.ensemble.IsolationForest`
- **Contamination Ratio**: `0.05`
- **Anomaly Score**: Normalized anomaly score $\in [0.0, 1.0]$. Scores $\ge 0.70$ are classified as `ANOMALOUS`.
- **Top Feature Contributions**: Computes decision tree split feature importances to highlight root cause sensors.

---

## 4. Machine Failure Mode Prediction Engine

Compares two candidate classification algorithms:
1. `RandomForestClassifier(n_estimators=100, max_depth=10)`
2. `GradientBoostingClassifier(n_estimators=100, learning_rate=0.1)`

### Model Evaluation Results

| Model Candidate | Accuracy | Precision | Recall | F1-Score |
| :--- | :--- | :--- | :--- | :--- |
| **RandomForestClassifier** | **96.4%** | **0.96** | **0.96** | **0.96** |
| **GradientBoostingClassifier** | 95.1% | 0.95 | 0.95 | 0.95 |

### Risk Level Categorization

- `LOW`: Failure Probability $< 0.25$
- `MEDIUM`: $0.25 \le P_{\text{failure}} < 0.55$
- `HIGH`: $0.55 \le P_{\text{failure}} < 0.80$
- `CRITICAL`: $P_{\text{failure}} \ge 0.80$

---

## 5. Remaining Useful Life (RUL) Prediction Engine

- **Algorithm**: `RandomForestRegressor(n_estimators=100)`
- **Target Variable**: Continuous estimated operational hours remaining until failure.
- **Evaluation Metrics**:
  - Mean Absolute Error (MAE): `3.42 hours`
  - Root Mean Squared Error (RMSE): `4.81 hours`
  - $R^2$ Score: `0.945`
