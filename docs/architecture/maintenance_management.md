# Maintenance Management & Work Order Architecture

The **Maintenance Management Module** provides end-to-end work order tracking, engineer assignment, status lifecycle management, and automated AI maintenance recommendations.

---

## Work Order Status Lifecycle

```text
[OPEN] ---> (Assign Engineer) ---> [ASSIGNED] ---> (Start Work) ---> [IN_PROGRESS] ---> (Finish Work) ---> [COMPLETED]
  |                                                                                                               
  +-------------------------------> (Cancel Order) ------------------------------------------------------> [CANCELLED]
```

- `OPEN`: Work order created and waiting for engineer assignment.
- `ASSIGNED`: Engineer assigned to work order.
- `IN_PROGRESS`: Service engineer actively carrying out maintenance inspection.
- `COMPLETED`: Work order completed; serviced timestamp, completion notes, and cost recorded.
- `CANCELLED`: Work order superseded or cancelled.

---

## Priority Ratings

- `LOW`: Standard preventive maintenance routine.
- `MEDIUM`: Operational check or scheduled component calibration.
- `HIGH`: Degradation trend flagged by AI telemetry models.
- `CRITICAL`: Immediate inspection required due to active telemetry anomaly or critical threshold breach.

---

## Automated AI Maintenance Recommendations

When AI models detect anomalous behavior or impending degradation:
1. **Triggers**:
   - Anomaly score $\ge 0.70$ or status `ANOMALOUS`.
   - High failure mode probability $\ge 0.55$.
   - Estimated Remaining Useful Life (RUL) $\le 100\text{ hours}$.
   - Critical telemetry boundary exceeded (e.g. vibration $> 10.0\text{ mm/s}$ or temperature $> 90^\circ\text{C}$).
2. **Deduplication Check**: `MaintenanceRecordRepository.findActiveAiRecommendations(machineId)` ensures only one active unacknowledged AI recommendation task exists per machine at a time.
3. **Physical Claim Disclaimer Policy**: Does **NOT** automatically claim physical machine failure. Phrased strictly as an inspection recommendation:
   > *"AI Preventive Inspection Recommended: Telemetry degradation trend flagged."*

---

## REST API Endpoints

- `GET /api/maintenance` - List work orders (supports `status`, `priority`, `machineId` query parameters).
- `GET /api/maintenance/{id}` - Fetch work order detail by ID.
- `POST /api/maintenance` - Create new work order task.
- `PUT /api/maintenance/{id}` - Update work order status, priority, engineer assignment, notes.
- `PUT /api/maintenance/{id}/complete` - Mark work order completed with cost & completion notes.
- `GET /api/maintenance/dashboard/summary` - Metrics summary (overdue, upcoming, completed, critical counts).
- `GET /api/maintenance/machine/{machineId}` - Fetch maintenance history for an asset.
