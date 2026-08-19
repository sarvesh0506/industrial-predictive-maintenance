# REST API Reference Documentation

This document specifies the complete REST API endpoints exposed by the Spring Boot Backend (`http://localhost:8080/api`) and FastAPI ML Service (`http://localhost:8000/ml`).

---

## 1. Authentication & Security Endpoints (`/api/auth`)

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Public | Register a new platform user account |
| `/api/auth/login` | `POST` | Public | Authenticate user and issue JWT Bearer Token |
| `/api/auth/me` | `GET` | Authenticated | Retrieve current authenticated user profile |

---

## 2. Machine Asset Management Endpoints (`/api/machines`)

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/machines` | `GET` | All Roles | Query machine inventory (supports search, status, criticality, page) |
| `/api/machines/{id}` | `GET` | All Roles | Fetch detailed machine information, sensors, latest readings, predictions |
| `/api/machines` | `POST` | ADMIN, ENGINEER | Register new industrial machine asset |
| `/api/machines/{id}` | `PUT` | ADMIN, ENGINEER | Update machine asset specifications |
| `/api/machines/{id}` | `DELETE` | ADMIN, ENGINEER | Delete machine asset record |

---

## 3. Sensor Management Endpoints (`/api/sensors`)

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/sensors` | `GET` | All Roles | Query telemetry sensors |
| `/api/sensors/{id}` | `GET` | All Roles | Fetch sensor details and history |
| `/api/sensors` | `POST` | ADMIN, ENGINEER | Register new sensor on an asset |
| `/api/sensors/{id}` | `PUT` | ADMIN, ENGINEER | Update sensor parameters |
| `/api/sensors/{id}` | `DELETE` | ADMIN, ENGINEER | Remove sensor record |

---

## 4. Maintenance Work Orders Endpoints (`/api/maintenance`)

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/maintenance` | `GET` | All Roles | Query maintenance tasks (status, priority, machine filter) |
| `/api/maintenance/{id}` | `GET` | All Roles | Fetch work order details |
| `/api/maintenance` | `POST` | ADMIN, ENGINEER | Create maintenance work order task |
| `/api/maintenance/{id}` | `PUT` | ADMIN, ENGINEER | Update work order status, priority, assigned engineer, due date |
| `/api/maintenance/{id}/complete` | `PUT` | ADMIN, ENGINEER | Mark work order completed with cost & notes |
| `/api/maintenance/dashboard/summary` | `GET` | All Roles | Fetch maintenance dashboard summary stat metrics |

---

## 5. Industrial Alert Endpoints (`/api/alerts`)

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/alerts` | `GET` | All Roles | Query alert notifications (severity, source, status, search) |
| `/api/alerts/{id}` | `GET` | All Roles | Fetch alert by ID |
| `/api/alerts/{id}/acknowledge` | `PUT` | All Roles | Acknowledge active alert |
| `/api/alerts/{id}/resolve` | `PUT` | ADMIN, ENGINEER | Resolve active alert |
| `/api/alerts/threshold-configs` | `GET` | All Roles | Fetch configurable sensor threshold settings |
| `/api/alerts/threshold-configs` | `PUT` | ADMIN, ENGINEER | Update sensor warning/critical thresholds |

---

## 6. Industrial Analytics & Export Endpoints (`/api/analytics`)

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/analytics/dashboard` | `GET` | All Roles | Calculate Uptime, Downtime, MTBF, MTTR, health trends, risk distribution |
| `/api/analytics/export/csv` | `GET` | All Roles | Export CSV report of analytics KPIs and machine breakdown |

---

## 7. Administration & Audit Log Endpoints (`/api/admin`)

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/admin/users` | `GET` | ADMIN | Fetch user account registry |
| `/api/admin/users/{id}/status` | `PUT` | ADMIN | Activate or deactivate user status |
| `/api/admin/users/{id}/role` | `PUT` | ADMIN | Assign user role (`ADMIN`, `ENGINEER`, `OPERATOR`) |
| `/api/admin/audit-logs` | `GET` | ADMIN | Query system audit trail |

---

## 8. Python FastAPI ML Service Endpoints (`http://localhost:8000`)

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `POST /ml/anomaly/train` | `POST` | Train Isolation Forest model on historical feature telemetry |
| `POST /ml/anomaly/predict` | `POST` | Predict anomaly score and identify top contributing features |
| `GET /ml/anomaly/status` | `GET` | Fetch model version and training status |
| `POST /ml/failure/train` | `POST` | Train machine failure classification models (RandomForest vs. GradientBoosting) |
| `POST /ml/failure/predict` | `POST` | Predict machine failure probability, risk level, and predicted failure type |
| `POST /ml/rul/train` | `POST` | Train Remaining Useful Life regression models |
| `POST /ml/rul/predict` | `POST` | Predict estimated remaining hours (RUL) and confidence interval |
