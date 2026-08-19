"""
IoT Asset Telemetry Simulator
Generates synthetic industrial sensor signals (vibration, temperature, pressure, rotation RPM)
and sends them to the backend API or MQTT broker.
"""
import time
import random
import datetime
import requests

BACKEND_API_URL = "http://localhost:8080/api/sensor-readings"

def generate_sensor_reading(sensor_id: int):
    # Base normal reading with small Gaussian noise
    base_val = 50.0 + random.normalvariate(0, 2.0)
    # 5% probability of anomaly spike
    if random.random() < 0.05:
        base_val += random.uniform(20.0, 45.0)
    
    return {
        "sensorId": sensor_id,
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "value": round(base_val, 2)
    }

def main():
    print("Starting Industrial IoT Telemetry Simulator...")
    sensor_ids = [1, 2, 3, 4]
    
    while True:
        for sid in sensor_ids:
            payload = generate_sensor_reading(sid)
            print(f"[Telemetry Stream] Sensor {sid} -> Value: {payload['value']}")
            try:
                # Optionally post to backend
                # requests.post(BACKEND_API_URL, json=payload, timeout=2)
                pass
            except Exception as e:
                pass
        time.sleep(3)

if __name__ == "__main__":
    main()
