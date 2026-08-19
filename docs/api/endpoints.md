# REST API Endpoints Specification

## Base URL
`/api`

## Endpoints Summary

| HTTP Method | Path | Description | Query Params / Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Health status of backend microservice | N/A |
| `GET` | `/api/machines` | List all machines | `status`, `criticality` |
| `GET` | `/api/machines/{id}` | Get machine details by ID | N/A |
| `POST` | `/api/machines` | Register a new machine | `MachineRequestDTO` |
| `PUT` | `/api/machines/{id}` | Update machine details | `MachineRequestDTO` |
| `DELETE` | `/api/machines/{id}` | Remove a machine | N/A |
| `GET` | `/api/sensors` | List all sensors | `machineId` |
| `GET` | `/api/sensors/{id}` | Get sensor details by ID | N/A |
| `POST` | `/api/sensors` | Register new sensor | `SensorRequestDTO` |
| `PUT` | `/api/sensors/{id}` | Update sensor details | `SensorRequestDTO` |
| `GET` | `/api/sensor-readings` | Get paginated sensor readings | `page`, `size`, `sort` |
| `GET` | `/api/sensor-readings/{sensorId}` | Get paginated readings for sensor | `page`, `size`, `sort` |
| `POST` | `/api/sensor-readings` | Record new telemetry reading | `SensorReadingRequestDTO` |
