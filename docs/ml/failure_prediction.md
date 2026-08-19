# Machine Failure Mode Prediction & Risk Assessment Engine

The **Machine Failure Prediction Engine** classifies industrial asset degradation into specific failure modes and assigns operational risk ratings.

---

## Synthetic Dataset Generation

In compliance with strict data integrity directives:
- When real plant data is unavailable, synthetic telemetry is generated using `ml-service/training/generate_failure_dataset.py`.
- **Synthetic Data Disclaimer**: Synthetic data is explicitly documented and labeled with `is_synthetic: true`. It is used exclusively for algorithmic training, feature correlation, and model benchmarking, and is **never presented as real physical industrial plant data**.

### Simulated Failure Classes
- `0: NORMAL` - Nominal operating parameters with baseline Gaussian noise.
- `1: OVERHEATING` - Thermal ramp and elevated temperature std/trend.
- `2: BEARING_DEGRADATION` - Exponential vibration growth and mechanical harmonics.
- `3: PRESSURE_FAILURE` - Pressure instability and hydraulic oscillation spikes.
- `4: MOTOR_DEGRADATION` - Electrical current surge combined with rotational RPM drop.

---

## Candidate Model Comparison & Metrics Evaluation

During `POST /ml/failure/train`, `MachineFailurePredictor` trains and evaluates multiple candidate algorithms (`RandomForestClassifier` vs `GradientBoostingClassifier`).

Metrics calculated per model:
- **Accuracy**: Overall classification accuracy on 25% test split.
- **Precision**: Macro-averaged precision across all failure modes.
- **Recall**: Macro-averaged recall across all failure modes.
- **F1-Score**: Macro-averaged F1 score.
- **Confusion Matrix**: Multi-class confusion matrix matrix.

The model achieving the higher F1-score is automatically selected, saved to `models/failure_classifier.joblib`, and benchmark metrics serialized to `models/failure_evaluation_report.json`.

---

## Prediction JSON Payload Schema

```json
{
  "machineId": "MCH-CNC-001",
  "failureProbability": 0.8524,
  "riskLevel": "CRITICAL",
  "predictedFailureType": "BEARING_DEGRADATION",
  "importantFeatures": [
    { "feature": "vibration_trend", "score": 0.65 },
    { "feature": "vibration_std", "score": 0.25 }
  ],
  "timestamp": "2026-08-19T14:30:00.000Z",
  "modelVersion": "v1.0-RandomForestClassifier",
  "disclaimer": "Predictions are probabilistic estimates based on telemetry trends and do not guarantee physical machine outcomes."
}
```

---

## Risk Level Thresholds

| Failure Probability | Risk Level | Description |
| :--- | :--- | :--- |
| `0.00 - 0.24` | `LOW` | Nominal operating health |
| `0.25 - 0.54` | `MEDIUM` | Mild degradation observed |
| `0.55 - 0.79` | `HIGH` | Significant failure mode trajectory |
| `0.80 - 1.00` | `CRITICAL` | Imminent failure expected; requires immediate intervention |
