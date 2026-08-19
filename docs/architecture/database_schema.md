# Database Schema & Relational Specifications

This document specifies the PostgreSQL 16 relational database schema, table structures, foreign key relationships, composite index definitions, and entity mappings for the platform.

---

## Entity Relationship Summary

```
+--------------------+           +--------------------+
|       users        |           |      machines      |
+--------------------+           +--------------------+
| PK  id             |           | PK  id             |
|     username (UQ)  |           |     machine_code   |
|     email (UQ)     |           |     status         |
|     role           |           +---------+----------:
|     status         |                     | 1
+---------+----------+                     |
          | 1                              | N
          | N                              v
+---------v----------+           +--------------------+
|    audit_logs      |           |      sensors       |
+--------------------+           +--------------------+
| PK  id             |           | PK  id             |
| FK  admin_username |           | FK  machine_id     |
|     action         |           |     sensor_code    |
+--------------------+           +---------+----------+
                                           | 1
                                           | N
                                           v
                                 +--------------------+
                                 |  sensor_readings   |
                                 +--------------------+
                                 | PK  id             |
                                 | FK  sensor_id      |
                                 |     reading_value  |
                                 |     timestamp (IDX)|
                                 +--------------------+
```

---

## Primary Tables & Schema

### 1. `users`
- `id` (BIGINT, PRIMARY KEY, AUTO_INCREMENT)
- `username` (VARCHAR(50), UNIQUE, NOT NULL)
- `email` (VARCHAR(100), UNIQUE, NOT NULL)
- `password_hash` (VARCHAR(255), NOT NULL)
- `full_name` (VARCHAR(100))
- `role` (VARCHAR(30), Enum: `ADMIN`, `ENGINEER`, `OPERATOR`, NOT NULL)
- `status` (VARCHAR(20), `ACTIVE` / `INACTIVE`, DEFAULT `'ACTIVE'`)
- `created_at` (TIMESTAMP, NOT NULL)
- `updated_at` (TIMESTAMP, NOT NULL)

### 2. `machines`
- `id` (BIGINT, PRIMARY KEY, AUTO_INCREMENT)
- `machine_code` (VARCHAR(50), UNIQUE, NOT NULL)
- `machine_name` (VARCHAR(100), NOT NULL)
- `machine_type` (VARCHAR(50), NOT NULL)
- `location` (VARCHAR(100))
- `status` (VARCHAR(30), Enum: `RUNNING`, `IDLE`, `MAINTENANCE`, `OFFLINE`, `CRITICAL`)
- `criticality` (VARCHAR(20), Enum: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)

### 3. `sensors`
- `id` (BIGINT, PRIMARY KEY, AUTO_INCREMENT)
- `machine_id` (BIGINT, FOREIGN KEY $\rightarrow$ `machines.id`, NOT NULL)
- `sensor_code` (VARCHAR(50), UNIQUE, NOT NULL)
- `sensor_type` (VARCHAR(50), Enum: `TEMPERATURE`, `VIBRATION`, `PRESSURE`, `RPM`, `CURRENT`, `VOLTAGE`)
- `unit` (VARCHAR(20))
- `status` (VARCHAR(20), `ACTIVE` / `INACTIVE`)

### 4. `sensor_readings`
- `id` (BIGINT, PRIMARY KEY, AUTO_INCREMENT)
- `sensor_id` (BIGINT, FOREIGN KEY $\rightarrow$ `sensors.id`, NOT NULL)
- `reading_value` (DOUBLE PRECISION, NOT NULL)
- `timestamp` (TIMESTAMP, NOT NULL)

### 5. `maintenance_records`
- `id` (BIGINT, PRIMARY KEY, AUTO_INCREMENT)
- `machine_id` (BIGINT, FOREIGN KEY $\rightarrow$ `machines.id`, NOT NULL)
- `task_title` (VARCHAR(150))
- `maintenance_type` (VARCHAR(50), NOT NULL)
- `status` (VARCHAR(30), Enum: `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`)
- `priority` (VARCHAR(30), Enum: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
- `assigned_engineer` (VARCHAR(100))
- `due_date` (TIMESTAMP)
- `cost` (NUMERIC(10,2))
- `ai_recommended` (BOOLEAN, DEFAULT FALSE)

### 6. `alerts`
- `id` (BIGINT, PRIMARY KEY, AUTO_INCREMENT)
- `machine_id` (BIGINT, FOREIGN KEY $\rightarrow$ `machines.id`, NOT NULL)
- `sensor_id` (BIGINT, FOREIGN KEY $\rightarrow$ `sensors.id`)
- `alert_source` (VARCHAR(50), Enum: `SENSOR_THRESHOLD`, `ANOMALY_DETECTION`, `FAILURE_PREDICTION`, `RUL_WARNING`, `MACHINE_OFFLINE`, `OVERDUE_MAINTENANCE`)
- `severity` (VARCHAR(20), Enum: `INFO`, `WARNING`, `CRITICAL`)
- `alert_message` (VARCHAR(255), NOT NULL)
- `status` (VARCHAR(30), Enum: `ACTIVE`, `ACKNOWLEDGED`, `RESOLVED`)
- `is_acknowledged` (BOOLEAN, DEFAULT FALSE)

---

## Performance Index Definitions

```sql
-- Sensor Readings Composite Index
CREATE INDEX idx_sensor_readings_sensor_timestamp ON sensor_readings (sensor_id, timestamp DESC);
CREATE INDEX idx_sensor_readings_timestamp ON sensor_readings (timestamp DESC);

-- Alerts Composite Indexes
CREATE INDEX idx_alerts_machine_status ON alerts (machine_id, status);
CREATE INDEX idx_alerts_severity ON alerts (severity);
CREATE INDEX idx_alerts_triggered_at ON alerts (triggered_at DESC);

-- Maintenance Work Orders Composite Indexes
CREATE INDEX idx_maintenance_status_priority ON maintenance_records (status, priority);
CREATE INDEX idx_maintenance_machine_id ON maintenance_records (machine_id);
CREATE INDEX idx_maintenance_due_date ON maintenance_records (due_date);
```
