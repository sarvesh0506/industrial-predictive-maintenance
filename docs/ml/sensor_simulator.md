# Industrial Telemetry Sensor Simulator

The **Industrial Telemetry Sensor Simulator** (`simulator/simulator.py`) is a physics-based Python simulation engine designed to generate realistic multi-sensor IoT telemetry for industrial machinery without requiring physical hardware.

---

## Key Features

1. **Multi-Asset Machine Simulation**: Models telemetry across $N$ virtual industrial assets (e.g. CNC Milling Machines, Lathes, Hydraulic Pumps, Air Compressors, Conveyor Motors).
2. **6 Sensor Channels Per Machine**:
   - `temperature` (°C) — Operating thermal dynamics & thermal inertia
   - `vibration` (mm/s) — Mechanical rotational/vibrational oscillation
   - `pressure` (bar) — Hydraulic & pneumatic pressure levels
   - `rpm` (RPM) — Motor shaft rotational speed
   - `current` (Amperes) — Electrical power consumption & electrical load draw
   - `voltage` (Volts) — Line power stability
3. **Realistic Physics Models**:
   - Periodic load fluctuations modeled using $\sin(\omega t)$ sinusoidal curves.
   - White Gaussian noise $\mathcal{N}(0, \sigma^2)$ representing sensor noise.
   - Thermal inertia and load-proportional heat buildup.
4. **3 Operating Modes**:
   - `NORMAL`: Nominal operational behavior with minor noise and standard working cycles.
   - `WARNING`: Early degradation state with subtle drift and increased signal variance.
   - `FAILURE`: Critical breakdown state with rapid anomaly progression.
5. **5 Failure Scenarios**:
   - **Bearing Degradation**: Exponential growth in vibration ($v(t) = v_{\text{base}} + \alpha e^{\lambda t}$).
   - **Overheating**: Thermal ramp buildup ($\Delta T \uparrow$).
   - **Pressure Instability**: Unstable pressure oscillations and sudden drops.
   - **Motor Degradation**: Electrical current surge ($I \uparrow$) combined with mechanical drag and RPM decay ($\Omega \downarrow$).
   - **Combined Degradation**: Multi-sensor cascade anomaly across temperature, vibration, current, and RPM.

---

## Configuration via Environment Variables

The simulator is fully configurable using environment variables (or `.env` file):

| Environment Variable | Default | Description |
| :--- | :--- | :--- |
| `SIMULATOR_NUM_MACHINES` | `10` | Number of virtual machines to simulate |
| `SIMULATOR_PUBLISH_INTERVAL` | `5.0` | Seconds between telemetry output frames |
| `MQTT_BROKER_URL` / `MQTT_HOST` | `localhost` | MQTT Broker hostname or IP address |
| `MQTT_PORT` | `1883` | MQTT Broker port |
| `MQTT_TOPIC_PREFIX` | `industrial/telemetry` | Topic prefix for published MQTT messages |
| `SIMULATOR_FAILURE_PROBABILITY` | `0.15` | Probability of initiating a failure degradation scenario |
| `SIMULATOR_RANDOM_SEED` | `None` | Integer seed for deterministic/reproducible simulations |

---

## Telemetry Payload Structure (JSON)

Messages published over MQTT topic `industrial/telemetry/{machine_code}` follow this schema:

```json
{
  "machine_code": "MCH-CNC-001",
  "machine_name": "Industrial Asset 01",
  "machine_type": "Milling Machine",
  "timestamp": "2026-08-19T06:08:59.404000+00:00",
  "mode": "NORMAL",
  "failure_scenario": "NONE",
  "telemetry": {
    "temperature": 60.4,
    "vibration": 1.8,
    "pressure": 5.0,
    "rpm": 2960.1,
    "current": 12.5,
    "voltage": 400.2
  }
}
```

---

## Usage Instructions

### 1. Test Mode Execution
To run a fixed number of simulation ticks for testing without MQTT dependencies:
```bash
python simulator/simulator.py --test --iterations 5
```

### 2. Standalone Production Mode Execution
To run continuously publishing to your local or Dockerized Mosquitto MQTT broker:
```bash
python simulator/simulator.py
```

### 3. Running with Custom Configuration
```bash
$env:SIMULATOR_NUM_MACHINES="20"
$env:SIMULATOR_PUBLISH_INTERVAL="2.0"
$env:MQTT_BROKER_URL="localhost"
python simulator/simulator.py
```
