# AI-Based Isolation Forest Anomaly Detection Engine

The **AI Anomaly Detection Engine** provides real-time unsupervised anomaly scoring, failure classification, and feature attribution across industrial machinery telemetry.

---

## Microservice Architecture & Endpoints

The Python FastAPI microservice (`ml-service/`) exposes REST endpoints:

- `POST /ml/anomaly/train`: Fits Isolation Forest model and baseline statistics on telemetry training data.
- `POST /ml/anomaly/predict`: Executes real-time inference on incoming machine telemetry streams.
- `GET /ml/anomaly/status`: Returns model version, contamination factor, training timestamp, and feature baselines.

---

## Anomaly Detection Pipeline

```text
Incoming Telemetry Stream
   ↓
Feature Engineering & Normalization (IndustrialDataPipeline)
   ↓
Isolation Forest Decision Function Score (s)
   ↓
Normalized Anomaly Score A(s) ∈ [0.0, 1.0]
   ↓
Status Classification (NORMAL, WARNING, ANOMALOUS)
   ↓
Feature Attribution (Normalized Z-score deviation ranking)
   ↓
Spring Boot Integration (Alert creation & ongoing condition deduplication)
```

---

## Prediction JSON Payload Schema

```json
{
  "machineId": "MCH-CNC-001",
  "timestamp": "2026-08-19T14:22:00.000Z",
  "anomalyScore": 0.8842,
  "status": "ANOMALOUS",
  "importantFeatures": [
    { "feature": "vibration_trend", "score": 0.60 },
    { "feature": "temperature_mean", "score": 0.35 }
  ],
  "modelVersion": "v1.0-IsolationForest"
}
```

---

## Classification Thresholds

| Anomaly Score Range | Status | Action |
| :--- | :--- | :--- |
| `0.00 - 0.39` | `NORMAL` | Nominal operational state |
| `0.40 - 0.69` | `WARNING` | Pre-degradation trend flagged |
| `0.70 - 1.00` | `ANOMALOUS` | Critical anomaly detected; triggers Spring Boot Alert |

---

## Spring Boot Alert Deduplication Strategy

When `status == "ANOMALOUS"` or `anomalyScore >= 0.70`:
1. Spring Boot checks `AlertRepository.findByMachineIdAndIsAcknowledgedFalse(machineId)`.
2. If an active unacknowledged alert already exists for the ongoing condition, **it skips creating a duplicate alert**.
3. If no active alert exists, it creates a new `CRITICAL` alert detailing the anomaly score and top contributing features, and updates machine status to `CRITICAL`.
