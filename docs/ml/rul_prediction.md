# Remaining Useful Life (RUL) Prediction Engine

The **Remaining Useful Life (RUL) Prediction Engine** estimates the remaining operational hours of industrial assets before physical failure.

---

## Degradation Feature Extraction

The RUL regression pipeline (`ml-service/models/rul_predictor.py`) derives degradation signals over a rolling telemetry window:
- `vibration_trend`: Rate of change ($\Delta v / \Delta t$) in vibration amplitude.
- `temperature_trend`: Rate of change ($\Delta T / \Delta t$) in thermal equilibrium.
- `current_trend`: Rate of change ($\Delta I / \Delta t$) in motor electrical draw.
- `pressure_instability`: Rolling standard deviation/variance of hydraulic & pneumatic pressure.
- `rpm_degradation`: Speed drop deviation from nominal 3000 RPM baseline ($3000.0 - \text{rpm\_mean}$).

---

## Regression Model & Metrics Evaluation

`RulPredictor` trains a `RandomForestRegressor(n_estimators=100, max_depth=10)` to predict remaining operating hours.

### Evaluation Metrics
- **MAE** (Mean Absolute Error): Average absolute error in predicted RUL hours.
- **RMSE** (Root Mean Squared Error): Penalizes larger prediction deviations.
- **$R^2$** (Coefficient of Determination): Measures goodness-of-fit of the regression model.

Metrics are benchmarked on a 25% test split and serialized to `models/rul_evaluation_report.json`.

---

## Prediction JSON Response Schema

```json
{
  "machineId": "MCH-CNC-001",
  "estimatedRemainingHours": 127.5,
  "confidenceOrUncertainty": 0.92,
  "timestamp": "2026-08-19T14:38:00.000Z",
  "modelVersion": "v1.0-RandomForestRULRegressor",
  "disclaimer": "AI estimate based on telemetry degradation trends. Does not guarantee exact physical failure time."
}
```

---

## User Interface Display & AI Estimate Labeling

In the React Frontend (`MachineDetailPage.jsx`), RUL predictions are displayed prominently:

```text
Estimated RUL: 127 hours [AI ESTIMATE]
```

**Disclaimer Notice**:
> *"AI estimate based on telemetry degradation trends. Does not guarantee exact physical failure time."*
