# Industrial Analytics KPI Mathematical Definitions & Formulas

This document details how each Key Performance Indicator (KPI) is calculated using real PostgreSQL database telemetry and event records.

---

## 1. Fleet Uptime Percentage ($U$)

- **Definition**: The percentage of total fleet operating capacity time that machinery remains in nominal active service (`RUNNING` or `IDLE`).
- **Formula**:
  \[
  U = \max\left(0.0, \min\left(100.0, \frac{C_{\text{total}} - D}{C_{\text{total}}} \times 100\right)\right)
  \]
  Where:
  - $N$ = Total number of machines in fleet.
  - $T_{\text{hours}}$ = Total hours in selected timeframe (`24h`, `7d`, `30d`, or custom).
  - $C_{\text{total}} = N \times T_{\text{hours}}$ (Total operational capacity hours).
  - $D$ = Total cumulative downtime hours across all fleet assets.

---

## 2. Total Downtime ($D$)

- **Definition**: Cumulative hours during which machine assets were unavailable due to maintenance servicing, offline state, or critical condition.
- **Formula**:
  \[
  D = \sum_{m=1}^{N} \text{DowntimeHours}(m)
  \]

---

## 3. Maintenance Frequency ($M$)

- **Definition**: Total number of work order maintenance tasks created or serviced within the selected timeframe.
- **Source**: `COUNT(MaintenanceRecord)` where `createdAt` falls between timeframe start and end dates.

---

## 4. Anomaly Frequency ($A$)

- **Definition**: Total number of AI-flagged isolation forest anomaly events and critical severity alarms triggered.
- **Source**: `COUNT(Alert)` where `alertSource == "ANOMALY_DETECTION"` or `severity == "CRITICAL"`.

---

## 5. Average Fleet Failure Risk ($R$)

- **Definition**: The fleet-wide average probabilistic machine failure risk percentage.
- **Formula**:
  \[
  R = \frac{1}{N} \sum_{m=1}^{N} (\hat{P}_{\text{failure}}(m) \times 100)
  \]
  Where $\hat{P}_{\text{failure}}(m)$ is the latest ML failure probability prediction for machine $m$.

---

## 6. Average Machine Health Index ($H$)

- **Definition**: Fleet-wide continuous operational health index score.
- **Formula**:
  \[
  H = 100.0 - R
  \]

---

## 7. Mean Time Between Failures (MTBF)

- **Definition**: Average operational running hours achieved by asset machinery between consecutive failure/anomaly occurrences.
- **Formula**:
  \[
  \text{MTBF} = \frac{\text{Total Operating Hours}}{\text{Total Failure Events} + 1} = \frac{C_{\text{total}} - D}{A + 1}
  \]

---

## 8. Mean Time To Repair (MTTR)

- **Definition**: Average time required to repair, service, and restore a failed asset back to nominal operating status.
- **Formula**:
  \[
  \text{MTTR} = \frac{\text{Total Cumulative Downtime Hours}}{\text{Total Serviced Maintenance Repairs} + 1} = \frac{D}{M_{\text{completed}} + 1}
  \]
