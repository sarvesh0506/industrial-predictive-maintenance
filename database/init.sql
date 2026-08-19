-- AI-Powered Industrial Predictive Maintenance & Asset Intelligence Platform
-- PostgreSQL DDL Initializer Script

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(30) NOT NULL DEFAULT 'TECHNICIAN',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Machines Table
CREATE TABLE IF NOT EXISTS machines (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    machine_code VARCHAR(50) NOT NULL UNIQUE,
    machine_name VARCHAR(100) NOT NULL,
    machine_type VARCHAR(50) NOT NULL,
    location VARCHAR(100),
    manufacturer VARCHAR(100),
    model VARCHAR(50),
    installation_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'OPERATIONAL',
    criticality VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_machines_code ON machines(machine_code);
CREATE INDEX IF NOT EXISTS idx_machines_status ON machines(status);
CREATE INDEX IF NOT EXISTS idx_machines_criticality ON machines(criticality);

-- 3. Sensors Table
CREATE TABLE IF NOT EXISTS sensors (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sensor_code VARCHAR(50) NOT NULL UNIQUE,
    sensor_type VARCHAR(50) NOT NULL,
    machine_id BIGINT NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    unit VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sensors_machine_id ON sensors(machine_id);
CREATE INDEX IF NOT EXISTS idx_sensors_code ON sensors(sensor_code);

-- 4. SensorReadings Table
CREATE TABLE IF NOT EXISTS sensor_readings (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sensor_id BIGINT NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    value DOUBLE PRECISION NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor_timestamp ON sensor_readings(sensor_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp ON sensor_readings(timestamp DESC);

-- 5. MaintenanceRecords Table
CREATE TABLE IF NOT EXISTS maintenance_records (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    machine_id BIGINT NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    performed_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    maintenance_type VARCHAR(50) NOT NULL,
    description TEXT,
    serviced_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cost NUMERIC(10, 2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    machine_id BIGINT NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    sensor_id BIGINT REFERENCES sensors(id) ON DELETE SET NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'WARNING',
    alert_message VARCHAR(255) NOT NULL,
    is_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    triggered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Predictions Table
CREATE TABLE IF NOT EXISTS predictions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    machine_id BIGINT NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    failure_probability DOUBLE PRECISION NOT NULL,
    predicted_rul_hours DOUBLE PRECISION NOT NULL,
    anomaly_score DOUBLE PRECISION,
    prediction_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    model_version VARCHAR(50)
);

-- 8. MaintenanceSchedules Table
CREATE TABLE IF NOT EXISTS maintenance_schedules (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    machine_id BIGINT NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    assigned_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    scheduled_date DATE NOT NULL,
    task_description TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PLANNED',
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Initial Seed Data
INSERT INTO machines (machine_code, machine_name, machine_type, location, manufacturer, model, installation_date, status, criticality)
VALUES 
('MCH-CNC-001', 'High-Speed CNC Milling Machine', 'Milling Machine', 'Bay A - Sector 1', 'Haas Automation', 'VF-2SS', '2023-01-15', 'OPERATIONAL', 'CRITICAL'),
('MCH-PMP-002', 'Coolant Circulation Pump', 'Hydraulic Pump', 'Bay B - Sector 3', 'Grundfos', 'CR 15-3', '2022-08-10', 'OPERATIONAL', 'HIGH'),
('MCH-CMP-003', 'Rotary Screw Air Compressor', 'Compressor', 'Utility Room 2', 'Atlas Copco', 'GA 37', '2021-11-05', 'MAINTENANCE_REQUIRED', 'MEDIUM')
ON CONFLICT (machine_code) DO NOTHING;

INSERT INTO sensors (sensor_code, sensor_type, machine_id, unit, status)
VALUES
('SEN-VIB-01', 'VIBRATION', 1, 'mm/s', 'ACTIVE'),
('SEN-TMP-01', 'TEMPERATURE', 1, '°C', 'ACTIVE'),
('SEN-PRS-01', 'PRESSURE', 2, 'bar', 'ACTIVE'),
('SEN-RPM-01', 'ROTATION_SPEED', 3, 'RPM', 'ACTIVE')
ON CONFLICT (sensor_code) DO NOTHING;

INSERT INTO sensor_readings (sensor_id, timestamp, value)
VALUES
(1, NOW() - INTERVAL '10 minutes', 2.45),
(1, NOW() - INTERVAL '5 minutes', 2.52),
(1, NOW(), 2.89),
(2, NOW() - INTERVAL '10 minutes', 65.4),
(2, NOW() - INTERVAL '5 minutes', 66.1),
(2, NOW(), 67.8);
