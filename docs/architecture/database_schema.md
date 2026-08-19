# Database Schema Documentation

This document describes the PostgreSQL relational database schema for the **AI-Powered Industrial Predictive Maintenance & Asset Intelligence Platform**.

## Entity Relationship Summary

```
   +------------------+           +-------------------+           +----------------------+
   |      User        |           |      Machine      | 1      *  |     Sensor           |
   +------------------+           +-------------------+-----------+----------------------+
   | id (PK)          |           | id (PK)           |           | id (PK)              |
   | username         |           | machine_code (UQ) |           | sensor_code (UQ)     |
   | email            |           | machine_name      |           | sensor_type          |
   | role             |           | machine_type      |           | machine_id (FK)      |
   +------------------+           | location          |           | unit                 |
                                  | manufacturer      |           | status               |
                                  | model             |           +----------+-----------+
                                  | installation_date |                      | 1
                                  | status            |                      |
                                  | criticality       |                      | *
                                  +---------+---------+           +----------+-----------+
                                            | 1                   |    SensorReading     |
                                            |                     +----------------------+
                                            +-------------------> | id (PK)              |
                                            | * (Maintenance)     | sensor_id (FK)       |
                                            | * (Alerts)          | timestamp            |
                                            | * (Predictions)     | value                |
                                            | * (Schedules)       +----------------------+
```

---

## Table Specifications

### 1. `users`
Stores user accounts for plant engineers, maintenance technicians, and administrators.
- `id` (BIGINT, PRIMARY KEY, GENERATED ALWAYS AS IDENTITY)
- `username` (VARCHAR(50), NOT NULL, UNIQUE)
- `email` (VARCHAR(100), NOT NULL, UNIQUE)
- `password_hash` (VARCHAR(255), NOT NULL)
- `full_name` (VARCHAR(100))
- `role` (VARCHAR(30), NOT NULL)
- `status` (VARCHAR(20), NOT NULL)
- `created_at` (TIMESTAMP, NOT NULL)
- `updated_at` (TIMESTAMP, NOT NULL)

### 2. `machines`
Represents physical industrial assets monitored by the platform.
- `id` (BIGINT, PRIMARY KEY, GENERATED ALWAYS AS IDENTITY)
- `machine_code` (VARCHAR(50), NOT NULL, UNIQUE) - e.g. `CNC-LATHE-01`
- `machine_name` (VARCHAR(100), NOT NULL)
- `machine_type` (VARCHAR(50), NOT NULL)
- `location` (VARCHAR(100))
- `manufacturer` (VARCHAR(100))
- `model` (VARCHAR(50))
- `installation_date` (DATE)
- `status` (VARCHAR(30), NOT NULL) - e.g. `OPERATIONAL`, `MAINTENANCE_REQUIRED`, `OFFLINE`
- `criticality` (VARCHAR(20), NOT NULL) - e.g. `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- `created_at` (TIMESTAMP, NOT NULL)
- `updated_at` (TIMESTAMP, NOT NULL)

**Indexes**:
- `idx_machines_code` ON `machine_code`
- `idx_machines_status` ON `status`
- `idx_machines_criticality` ON `criticality`

### 3. `sensors`
Represents physical or virtual telemetry sensors mounted on machines.
- `id` (BIGINT, PRIMARY KEY, GENERATED ALWAYS AS IDENTITY)
- `sensor_code` (VARCHAR(50), NOT NULL, UNIQUE) - e.g. `VIB-01A`
- `sensor_type` (VARCHAR(50), NOT NULL) - e.g. `VIBRATION`, `TEMPERATURE`, `PRESSURE`, `RPM`
- `machine_id` (BIGINT, NOT NULL, FOREIGN KEY -> `machines(id)`)
- `unit` (VARCHAR(20), NOT NULL) - e.g. `mm/s`, `°C`, `PSI`, `RPM`
- `status` (VARCHAR(20), NOT NULL) - e.g. `ACTIVE`, `INACTIVE`, `FAULTY`
- `created_at` (TIMESTAMP, NOT NULL)
- `updated_at` (TIMESTAMP, NOT NULL)

**Indexes**:
- `idx_sensors_machine_id` ON `machine_id`
- `idx_sensors_code` ON `sensor_code`

### 4. `sensor_readings`
High-volume time-series telemetry data point table.
- `id` (BIGINT, PRIMARY KEY, GENERATED ALWAYS AS IDENTITY)
- `sensor_id` (BIGINT, NOT NULL, FOREIGN KEY -> `sensors(id)`)
- `timestamp` (TIMESTAMP, NOT NULL)
- `value` (DOUBLE PRECISION, NOT NULL)

**Indexes**:
- `idx_sensor_readings_sensor_timestamp` ON (`sensor_id`, `timestamp` DESC)
- `idx_sensor_readings_timestamp` ON (`timestamp` DESC)

### 5. `maintenance_records`
Historical maintenance log for machine repair and service history.
- `id` (BIGINT, PRIMARY KEY, GENERATED ALWAYS AS IDENTITY)
- `machine_id` (BIGINT, NOT NULL, FOREIGN KEY -> `machines(id)`)
- `performed_by_user_id` (BIGINT, FOREIGN KEY -> `users(id)`)
- `maintenance_type` (VARCHAR(50), NOT NULL) - e.g. `PREVENTIVE`, `CORRECTIVE`, `EMERGENCY`
- `description` (TEXT)
- `serviced_at` (TIMESTAMP, NOT NULL)
- `cost` (NUMERIC(10, 2))
- `created_at` (TIMESTAMP, NOT NULL)

### 6. `alerts`
Anomaly detection and threshold overflow alerts.
- `id` (BIGINT, PRIMARY KEY, GENERATED ALWAYS AS IDENTITY)
- `machine_id` (BIGINT, NOT NULL, FOREIGN KEY -> `machines(id)`)
- `sensor_id` (BIGINT, FOREIGN KEY -> `sensors(id)`)
- `severity` (VARCHAR(20), NOT NULL) - e.g. `INFO`, `WARNING`, `CRITICAL`
- `alert_message` (VARCHAR(255), NOT NULL)
- `is_acknowledged` (BOOLEAN, DEFAULT FALSE)
- `triggered_at` (TIMESTAMP, NOT NULL)

### 7. `predictions`
ML inference output table storing predicted failure probabilities and Remaining Useful Life (RUL).
- `id` (BIGINT, PRIMARY KEY, GENERATED ALWAYS AS IDENTITY)
- `machine_id` (BIGINT, NOT NULL, FOREIGN KEY -> `machines(id)`)
- `failure_probability` (DOUBLE PRECISION, NOT NULL)
- `predicted_rul_hours` (DOUBLE PRECISION, NOT NULL)
- `anomaly_score` (DOUBLE PRECISION)
- `prediction_time` (TIMESTAMP, NOT NULL)
- `model_version` (VARCHAR(50))

### 8. `maintenance_schedules`
Upcoming or assigned maintenance task schedules.
- `id` (BIGINT, PRIMARY KEY, GENERATED ALWAYS AS IDENTITY)
- `machine_id` (BIGINT, NOT NULL, FOREIGN KEY -> `machines(id)`)
- `assigned_user_id` (BIGINT, FOREIGN KEY -> `users(id)`)
- `scheduled_date` (DATE, NOT NULL)
- `task_description` (TEXT, NOT NULL)
- `status` (VARCHAR(30), NOT NULL) - e.g. `PLANNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`
- `priority` (VARCHAR(20), NOT NULL)
- `created_at` (TIMESTAMP, NOT NULL)
- `updated_at` (TIMESTAMP, NOT NULL)
