# Industrial Alert & Notification System Architecture

The **Industrial Alert System** provides real-time multi-source alert notifications, STOMP WebSocket broadcasts, duplicate prevention, and configurable sensor threshold settings.

---

## Alert Sources & Severities

### Alert Sources
- `SENSOR_THRESHOLD`: Sensor reading exceeds warning or critical boundaries.
- `ANOMALY_DETECTION`: Isolation Forest AI anomaly score $\ge 0.70$ or status `ANOMALOUS`.
- `FAILURE_PREDICTION`: High machine failure mode probability $\ge 0.55$.
- `RUL_WARNING`: Remaining Useful Life $\le 100\text{ hours}$.
- `MACHINE_OFFLINE`: Asset connectivity timeout or state change to `OFFLINE`.
- `OVERDUE_MAINTENANCE`: Work order maintenance task due date passed.

### Severity Levels
- `INFO`: Informational operational events.
- `WARNING`: Pre-degradation threshold breach or medium risk.
- `CRITICAL`: Immediate threat, anomaly, or critical boundary breach.

---

## Real-Time WebSocket Broadcasting

When an alert is triggered in `AlertService`:
1. It is persisted to PostgreSQL.
2. If `severity == "CRITICAL"`, machine status is updated to `CRITICAL`.
3. The alert payload is broadcasted over STOMP WebSocket destination `/topic/alerts`.
4. The React Frontend Alert Center subscribes to `/topic/alerts` and pops up an immediate live toast notification for critical alerts!

---

## Duplicate Alert Prevention Policy

To prevent alert fatigue and redundant notifications:
- `AlertRepository.findActiveAlertByMachineAndSource(machineId, alertSource)` checks if an active unacknowledged alert already exists for the same condition on that asset.
- If an active alert exists, new duplicate creation is skipped.

---

## Configurable Sensor Threshold Settings

Users can configure warning and critical boundaries per sensor type via REST API or the Alert Center UI modal:

- `GET /api/alerts/threshold-configs`
- `PUT /api/alerts/threshold-configs`

### Default Sensor Threshold Settings

| Sensor Type | Unit | Warning Min | Warning Max | Critical Min | Critical Max |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TEMPERATURE` | `°C` | - | `75.0` | - | `90.0` |
| `VIBRATION` | `mm/s` | - | `4.0` | - | `10.0` |
| `PRESSURE` | `bar` | `2.0` | `8.0` | `1.0` | `10.0` |
| `RPM` | `RPM` | `2000.0` | `3500.0` | `1000.0` | `4000.0` |
| `CURRENT` | `A` | - | `20.0` | - | `30.0` |
| `VOLTAGE` | `V` | `380.0` | `420.0` | `350.0` | `450.0` |

---

## REST API Endpoints

- `GET /api/alerts` - Query alerts (supports `severity`, `source`, `status`, `machineId`, `search`).
- `GET /api/alerts/{id}` - Fetch alert by ID.
- `POST /api/alerts` - Create alert manually.
- `PUT /api/alerts/{id}/acknowledge` - Acknowledge alert.
- `PUT /api/alerts/{id}/resolve` - Mark alert resolved.
- `GET /api/alerts/threshold-configs` - Get threshold settings.
- `PUT /api/alerts/threshold-configs` - Update threshold settings.
