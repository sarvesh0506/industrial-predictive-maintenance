import os
import sys
import time
import json
import math
import random
import logging
import argparse
from datetime import datetime, timezone
from enum import Enum

# Try loading python-dotenv if available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Try loading paho.mqtt if available
try:
    import paho.mqtt.client as mqtt
    HAS_MQTT = True
except ImportError:
    HAS_MQTT = False

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("IndustrialSimulator")

class OperatingMode(Enum):
    NORMAL = "NORMAL"
    WARNING = "WARNING"
    FAILURE = "FAILURE"

class FailureScenario(Enum):
    BEARING_DEGRADATION = "BEARING_DEGRADATION"
    OVERHEATING = "OVERHEATING"
    PRESSURE_INSTABILITY = "PRESSURE_INSTABILITY"
    MOTOR_DEGRADATION = "MOTOR_DEGRADATION"
    COMBINED_DEGRADATION = "COMBINED_DEGRADATION"

UNITS = {
    "temperature": "°C",
    "vibration": "mm/s",
    "pressure": "bar",
    "rpm": "RPM",
    "current": "A",
    "voltage": "V"
}

class VirtualMachine:
    """
    Virtual Machine asset representing physical machinery dynamics,
    cyclic load fluctuations, noise, operating modes, and realistic failure trends.
    """
    def __init__(self, machine_id: int, code: str, name: str, machine_type: str, failure_prob: float):
        self.machine_id = machine_id
        self.code = code
        self.name = name
        self.machine_type = machine_type
        self.failure_prob = failure_prob

        # Nominal Physics Baselines
        self.temp_base = random.uniform(58.0, 65.0)
        self.vib_base = random.uniform(1.4, 2.2)
        self.press_base = random.uniform(4.8, 5.2)
        self.rpm_base = random.uniform(2950.0, 3050.0)
        self.curr_base = random.uniform(11.0, 14.0)
        self.volt_base = random.uniform(398.0, 402.0)

        # Simulation State
        self.mode = OperatingMode.NORMAL
        self.active_scenario = None
        self.degradation_step = 0
        self.step_counter = 0

    def tick(() -> dict:
        pass

    def tick(self) -> dict:
        self.step_counter += 1
        
        # State Machine Transitions
        if self.mode == OperatingMode.NORMAL:
            if random.random() < (self.failure_prob * 0.05):
                self.mode = OperatingMode.WARNING
                self.active_scenario = random.choice(list(FailureScenario))
                self.degradation_step = 1
                logger.warning(f"⚠️ [{self.code}] Transited into WARNING mode! Active Scenario: {self.active_scenario.value}")
        elif self.mode == OperatingMode.WARNING:
            self.degradation_step += 1
            if self.degradation_step > 12 or random.random() < 0.15:
                self.mode = OperatingMode.FAILURE
                logger.error(f"🚨 [{self.code}] Transited into FAILURE mode! Severe anomaly in progress.")
        elif self.mode == OperatingMode.FAILURE:
            self.degradation_step += 1
            # Recovery / Service after 25 ticks in failure
            if self.degradation_step > 25:
                self.mode = OperatingMode.NORMAL
                self.active_scenario = None
                self.degradation_step = 0
                logger.info(f"✅ [{self.code}] Maintenance completed! Restored to NORMAL operating mode.")

        # Cyclic variation (load & thermal inertia)
        t = self.step_counter * 0.1
        cyclic_load = math.sin(t) * 1.5

        # Base noise
        temp = self.temp_base + (cyclic_load * 0.4) + random.gauss(0, 0.3)
        vib = self.vib_base + (abs(cyclic_load) * 0.1) + random.gauss(0, 0.1)
        press = self.press_base + (cyclic_load * 0.05) + random.gauss(0, 0.04)
        rpm = self.rpm_base + (cyclic_load * 12.0) + random.gauss(0, 5.0)
        curr = self.curr_base + (cyclic_load * 0.3) + random.gauss(0, 0.2)
        volt = self.volt_base + random.gauss(0, 0.8)

        # Apply Physics-based Degradation & Failure Trends
        if self.mode in [OperatingMode.WARNING, OperatingMode.FAILURE]:
            step_factor = self.degradation_step * (2.2 if self.mode == OperatingMode.FAILURE else 1.0)

            if self.active_scenario == FailureScenario.BEARING_DEGRADATION:
                vib += (0.6 * math.exp(step_factor * 0.25)) + random.gauss(0, 0.4)
                temp += (step_factor * 0.8)

            elif self.active_scenario == FailureScenario.OVERHEATING:
                temp += (step_factor * 2.5) + random.gauss(0, 0.8)
                curr += (step_factor * 0.4)

            elif self.active_scenario == FailureScenario.PRESSURE_INSTABILITY:
                press += (math.sin(self.step_counter * 0.8) * step_factor * 0.9) + random.gauss(0, 0.6)
                if press < 1.0: press = 1.0

            elif self.active_scenario == FailureScenario.MOTOR_DEGRADATION:
                curr += (step_factor * 1.4) + random.gauss(0, 0.5)
                rpm -= (step_factor * 85.0) + random.gauss(0, 15.0)
                vib += (step_factor * 0.4)
                if rpm < 500: rpm = 500.0

            elif self.active_scenario == FailureScenario.COMBINED_DEGRADATION:
                vib += (step_factor * 0.5)
                temp += (step_factor * 1.8)
                curr += (step_factor * 0.9)
                rpm -= (step_factor * 45.0)
                press -= (step_factor * 0.2)

        # Clamping physical boundaries
        temp = max(20.0, round(temp, 2))
        vib = max(0.1, round(vib, 2))
        press = max(0.5, round(press, 2))
        rpm = max(0.0, round(rpm, 1))
        curr = max(0.0, round(curr, 2))
        volt = max(300.0, round(volt, 1))

        iso_timestamp = datetime.now(timezone.utc).isoformat()

        # Build list of individual sensor payloads according to MQTT Pipeline schema:
        # { machineId, sensorId, sensorType, value, unit, timestamp }
        sensor_payloads = []
        metrics = {
            "TEMPERATURE": temp,
            "VIBRATION": vib,
            "PRESSURE": press,
            "RPM": rpm,
            "CURRENT": curr,
            "VOLTAGE": volt
        }

        for stype, sval in metrics.items():
            sensor_payloads.append({
                "machineId": self.code,
                "sensorId": f"SNR-{stype}-{self.code}",
                "sensorType": stype,
                "value": sval,
                "unit": UNITS[stype.lower()],
                "timestamp": iso_timestamp
            })

        return {
            "machineId": self.code,
            "machineName": self.name,
            "machineType": self.machine_type,
            "timestamp": iso_timestamp,
            "mode": self.mode.value,
            "failureScenario": self.active_scenario.value if self.active_scenario else "NONE",
            "sensors": sensor_payloads,
            "telemetry": {
                "temperature": temp,
                "vibration": vib,
                "pressure": press,
                "rpm": rpm,
                "current": curr,
                "voltage": volt
            }
        }


class TelemetrySimulator:
    """
    Orchestrates virtual industrial machines, handles environment variable configurations,
    logs telemetry output, and publishes JSON payloads over MQTT topic pattern:
    factory/{machineId}/sensor/{sensorType}
    """
    def __init__(self):
        # Load Configurations from Environment Variables
        self.num_machines = int(os.getenv("SIMULATOR_NUM_MACHINES", "10"))
        self.publish_interval = float(os.getenv("SIMULATOR_PUBLISH_INTERVAL", "5.0"))
        self.mqtt_broker = os.getenv("MQTT_BROKER_URL", os.getenv("MQTT_HOST", "localhost"))
        self.mqtt_port = int(os.getenv("MQTT_PORT", "1883"))
        self.failure_probability = float(os.getenv("SIMULATOR_FAILURE_PROBABILITY", "0.15"))
        self.seed = os.getenv("SIMULATOR_RANDOM_SEED")

        if self.seed is not None:
            random.seed(int(self.seed))
            logger.info(f"Initialized random seed: {self.seed}")

        # Initialize Virtual Machines
        self.machines = []
        types = ["Milling Machine", "Lathe", "Hydraulic Pump", "Air Compressor", "Conveyor Motor"]
        for i in range(1, self.num_machines + 1):
            code = f"MCH-CNC-{i:03d}"
            name = f"Industrial Asset {i:02d}"
            mtype = types[(i - 1) % len(types)]
            self.machines.append(VirtualMachine(i, code, name, mtype, self.failure_probability))

        logger.info(f"Initialized {len(self.machines)} Virtual Machine Assets.")

        # Initialize MQTT Client if available
        self.mqtt_client = None
        if HAS_MQTT:
            try:
                self.mqtt_client = mqtt.Client(client_id=f"industrial-simulator-{random.randint(1000, 9999)}")
                self.mqtt_client.connect(self.mqtt_broker, self.mqtt_port, keepalive=60)
                self.mqtt_client.loop_start()
                logger.info(f"Connected to MQTT Broker at {self.mqtt_broker}:{self.mqtt_port}")
            except Exception as e:
                logger.warning(f"Could not connect to MQTT Broker ({self.mqtt_broker}:{self.mqtt_port}): {e}. Operating in logging mode.")
                self.mqtt_client = None
        else:
            logger.info("paho-mqtt library not detected. Operating in console logging mode.")

    def run(self, max_iterations=None):
        logger.info(f"Starting MQTT Pipeline Simulator Loop. Interval: {self.publish_interval}s. Machines: {self.num_machines}")
        iterations = 0

        try:
            while True:
                iterations += 1
                logger.info(f"--- Simulating Telemetry Frame #{iterations} ---")
                
                for machine in self.machines:
                    data = machine.tick()

                    # Log formatted status
                    mode_str = data['mode']
                    scenario_str = data['failureScenario']
                    t = data['telemetry']
                    
                    logger.info(
                        f"[{data['machineId']}] Mode: {mode_str:8s} | Scenario: {scenario_str:21s} | "
                        f"Temp: {t['temperature']:5.1f}°C | Vib: {t['vibration']:4.1f}mm/s | "
                        f"Press: {t['pressure']:4.1f}bar | RPM: {t['rpm']:6.1f} | Curr: {t['current']:5.1f}A"
                    )

                    # Publish each sensor reading over topic format: factory/{machineId}/sensor/{sensorType}
                    for sensor_payload in data["sensors"]:
                        topic = f"factory/{sensor_payload['machineId']}/sensor/{sensor_payload['sensorType'].lower()}"
                        payload_json = json.dumps(sensor_payload)

                        if self.mqtt_client:
                            self.mqtt_client.publish(topic, payload_json)

                if max_iterations and iterations >= max_iterations:
                    logger.info(f"Completed requested {max_iterations} simulation iterations.")
                    break

                time.sleep(self.publish_interval)

        except KeyboardInterrupt:
            logger.info("Simulator loop stopped by user.")
        finally:
            if self.mqtt_client:
                self.mqtt_client.loop_stop()
                self.mqtt_client.disconnect()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Industrial Predictive Maintenance Telemetry Simulator")
    parser.add_argument("--test", action="store_true", help="Run in test mode for a fixed number of iterations")
    parser.add_argument("--iterations", type=int, default=3, help="Number of iterations in test mode")
    args = parser.parse_args()

    simulator = TelemetrySimulator()
    if args.test:
        simulator.run(max_iterations=args.iterations)
    else:
        simulator.run()
