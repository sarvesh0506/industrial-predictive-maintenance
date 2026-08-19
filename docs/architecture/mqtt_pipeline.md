# Real-time MQTT Telemetry Pipeline Architecture

The **Real-time Telemetry Pipeline** ingests physical/virtual IoT sensor streams, validates payloads, resolves machine/sensor mappings, persists readings to PostgreSQL, and broadcasts real-time telemetry updates to connected React clients using WebSockets (STOMP).

---

## Pipeline End-to-End Architecture Flow

```
┌───────────────────────────┐
│ Python Sensor Simulator   │  (Generates telemetry for 10+ virtual machines)
└─────────────┬─────────────┘
              │ MQTT Pub (QoS 1)
              ▼
┌───────────────────────────┐
│ Eclipse Mosquitto Broker  │  (Port 1883 MQTT / Port 9001 WebSockets)
└─────────────┬─────────────┘
              │ Sub: factory/+/sensor/+
              ▼
┌───────────────────────────┐
│ Spring Boot Backend       │  (MqttPahoMessageDrivenChannelAdapter)
│ ├─ Payload Validation     │
│ ├─ Machine & Sensor Lookup│  (Auto-registers missing sensors)
│ ├─ Timestamp Deduplication│
│ └─ PostgreSQL DB Save     │  (SensorReading repository)
└─────────────┬─────────────┘
              │ STOMP Broadcast (/topic/telemetry)
              ▼
┌───────────────────────────┐
│ React 18 Dashboard UI     │  (Real-time charts & asset health updates)
└───────────────────────────┘
```

---

## MQTT Topic Hierarchy & Payload Specifications

### 1. Topic Pattern
```text
factory/{machineId}/sensor/{sensorType}
```
**Examples**:
- `factory/MCH-CNC-001/sensor/temperature`
- `factory/MCH-CNC-001/sensor/vibration`
- `factory/MCH-CNC-001/sensor/pressure`
- `factory/MCH-CNC-001/sensor/rpm`
- `factory/MCH-CNC-001/sensor/current`
- `factory/MCH-CNC-001/sensor/voltage`

### 2. Payload Schema (JSON)
```json
{
  "machineId": "MCH-CNC-001",
  "sensorId": "SNR-TEMP-MCH-CNC-001",
  "sensorType": "TEMPERATURE",
  "value": 64.2,
  "unit": "°C",
  "timestamp": "2026-08-19T11:44:00.000Z"
}
```

---

## Error Handling & Resiliency Strategies

1. **Automatic Reconnection**:
   - `MqttPahoClientFactory` is configured with `automaticReconnect=true` and a 60-second keepalive ping. If Mosquitto restarts or network drops, Spring Boot automatically reconnects upon broker restoration.
2. **Invalid Payload Rejection**:
   - JSON parsing errors or missing mandatory attributes (`machineId`, `sensorType`, `value`) are logged as structured warnings and rejected without throwing unhandled runtime exceptions.
3. **Unknown Machine Handling**:
   - Payload targeting un-registered machines (`machineCode` not in DB) are safely skipped and logged.
4. **Auto-Registration of Missing Sensors**:
   - If a valid machine is targeted by a new sensor code, `MqttTelemetryIngestionService` automatically registers the new `Sensor` with status `ACTIVE`.
5. **Deduplication**:
   - Incoming readings are checked against the last persisted timestamp for that sensor to prevent duplicate database inserts during MQTT retries.

---

## Environment Variable Configuration

| Environment Variable | Spring Property | Default | Description |
| :--- | :--- | :--- | :--- |
| `MQTT_ENABLED` | `app.mqtt.enabled` | `true` | Toggle MQTT pipeline subscriber |
| `MQTT_BROKER_URL` | `app.mqtt.broker-url` | `tcp://localhost:1883` | Mosquitto MQTT broker URL |
| `MQTT_CLIENT_ID` | `app.mqtt.client-id` | `ipm-backend-subscriber` | MQTT Subscriber client identifier |
| `MQTT_TOPIC_PATTERN` | `app.mqtt.topic-pattern` | `factory/+/sensor/+` | Subscribed MQTT topic pattern |
| `MQTT_USERNAME` | `app.mqtt.username` | `""` | MQTT Broker username (optional) |
| `MQTT_PASSWORD` | `app.mqtt.password` | `""` | MQTT Broker password (optional) |
