# Industrial Analytics & KPI Dashboard Architecture

The **Industrial Analytics Module** provides real-time KPI calculations, timeframe filtering, interactive Recharts visualizations, and CSV report export using live PostgreSQL database records.

---

## Key Performance Indicators (KPIs)

1. **Uptime (%)**: Fleet operational availability percentage across active machine inventory.
2. **Downtime (Hours)**: Total cumulative hours machinery was offline, undergoing maintenance, or in critical status.
3. **Maintenance Frequency**: Total work order maintenance tasks created or serviced in timeframe.
4. **Anomaly Frequency**: Count of AI-flagged anomaly events and critical alarms.
5. **Avg Failure Risk (%)**: Average fleet-wide ML failure probability score.
6. **Machine Health Index (%)**: Average fleet-wide operational health baseline.
7. **MTBF (Mean Time Between Failures)**: Average operational running hours between anomaly occurrences.
8. **MTTR (Mean Time To Repair)**: Average duration required to service and complete work order tasks.

---

## Timeframe Range Filters

- `24h`: Last 24 Hours.
- `7d`: Last 7 Days (Default).
- `30d`: Last 30 Days.
- `custom`: Custom Start & End DateTime Range Picker.

---

## Visualizations & CSV Export

- **Machine Health Trend**: Line chart tracking health index trajectory over time.
- **Anomalies Flagged Over Time**: Bar chart of anomaly frequency events over time.
- **Downtime Hours per Machine**: Bar chart highlighting high-downtime assets.
- **Failure Risk Category Distribution**: Categorical distribution across `LOW`, `MEDIUM`, `HIGH`, and `CRITICAL` risk ratings.
- **CSV Report Export**: Downloadable formatted CSV file containing executive summary KPIs and machine fleet performance breakdown.

---

## REST API Endpoints

- `GET /api/analytics/dashboard` (params: `range`, `startDate`, `endDate`)
- `GET /api/analytics/export/csv` (params: `range`, `startDate`, `endDate`)
