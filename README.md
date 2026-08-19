# AI-Powered Industrial Predictive Maintenance & Asset Intelligence Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()
[![Java](https://img.shields.io/badge/Java-21-orange.svg)]()
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-green.svg)]()
[![React](https://img.shields.io/badge/React-18-blue.svg)]()
[![FastAPI](https://img.shields.io/badge/FastAPI-Python%203.11+-009688.svg)]()

> AI-powered industrial predictive maintenance platform for real-time machine monitoring, anomaly detection, failure prediction, RUL (Remaining Useful Life) estimation, and intelligent maintenance management using IoT, ML, and full-stack technologies.

---

## Table of Contents
- [Project Overview](#project-overview)
- [Problem Statement](#problem-statement)
- [Objectives](#objectives)
- [Technology Stack](#technology-stack)
- [Architecture Overview](#architecture-overview)
- [Module Structure](#module-structure)
- [Database Schema & APIs](#database-schema--apis)
- [Setup & Quickstart](#setup--quickstart)
- [Development Roadmap](#development-roadmap)

---

## Project Overview

Unplanned industrial machine breakdowns cause billions of dollars in lost productivity, unexpected maintenance costs, and catastrophic asset damage annually. **AI-Powered Industrial Predictive Maintenance & Asset Intelligence Platform** combines real-time IoT sensor telemetry ingestion, machine learning failure prediction, and interactive dashboard monitoring to shift industrial operations from reactive/scheduled maintenance to proactive, data-driven asset intelligence.

---

## Problem Statement

Traditional industrial plant operations rely on either **reactive maintenance** (fixing machines after catastrophic failure) or **preventative maintenance** (servicing assets on fixed calendars regardless of actual health).
- **High Downtime Costs**: Unscheduled equipment failure halts production lines.
- **Resource Inefficiency**: Maintenance performed too early wastes components and labor; maintenance performed too late causes severe damage.
- **Data Isolation**: High-frequency IoT telemetry from vibration, thermal, and pressure sensors often remains unanalyzed in real time.

---

## Objectives

1. **Real-time Telemetry Ingestion**: Capture telemetry streams (vibration, temperature, pressure, rotation RPM) via MQTT brokers and REST/WebSockets.
2. **AI-Driven Failure Prediction & RUL**: Execute continuous anomaly detection and Remaining Useful Life (RUL) estimation using scikit-learn ML models.
3. **Asset & Maintenance Operations**: Provide automated alerting, maintenance schedule dispatching, and historical audit logs.
4. **Intuitive Operator Dashboard**: Provide plant engineers with real-time operational health gauges, interactive charts, and actionable asset failure risk scores.

---

## Technology Stack

### Monorepo Core Stack
| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, JavaScript, Tailwind CSS, Axios, Recharts | Interactive telemetry dashboard & management console |
| **Backend** | Java 21, Spring Boot 3.x, Spring Data JPA, Spring Security, Maven | Enterprise core REST services, domain management & persistence |
| **AI / ML Service** | Python 3.11+, FastAPI, pandas, numpy, scikit-learn, joblib | Predictive analytics, anomaly detection & RUL inference engine |
| **Real-time Ingestion** | MQTT (Eclipse Mosquitto), WebSocket | Industrial IoT telemetry messaging broker |
| **Database** | PostgreSQL 16 | Relational data store with indexed temporal telemetry tables |
| **Infrastructure** | Docker, Docker Compose | Container orchestration for microservice deployment |

---

## Architecture Overview

```
                        +---------------------------+
                        |  Industrial IoT Simulator |
                        | (Sensors: Temp/Vib/Press) |
                        +-------------+-------------+
                                      |
                                      v [MQTT]
                        +-------------+-------------+
                        |   Eclipse Mosquitto Broker |
                        +-------------+-------------+
                                      |
                                      v
+------------------+         +--------+--------+         +-------------------+
|  React Dashboard | <-----> |   Spring Boot   | <-----> |  PostgreSQL DB    |
|  (Frontend)      |  REST/  |   Backend API   |   JPA   |  (Assets/Readings)|
+------------------+  WS     +--------+--------+         +-------------------+
                                      |
                                      v REST
                             +--------+--------+
                             |  FastAPI ML     |
                             |  Inference Engine|
                             +-----------------+
```

---

## Module Structure

```
industrial-predictive-maintenance/
├── frontend/             # React + Vite + Tailwind dashboard
├── backend/              # Java 21 + Spring Boot 3 REST application & JPA persistence
├── ml-service/           # FastAPI Python predictive analytics service
├── simulator/            # IoT sensor telemetry stream simulator script
├── mqtt/                 # Eclipse Mosquitto broker configuration
├── database/             # PostgreSQL DDL initialization schema & indexes
├── docs/                 # Platform architecture, API, and ML design documentation
│   ├── architecture/     # Architecture & DB schema specifications
│   ├── api/              # OpenAPI / REST endpoint specifications
│   ├── ml/               # Model training & feature engineering documentation
│   └── diagrams/         # System architecture & sequence diagrams
├── .gitignore            # Multi-stack git ignore configuration
├── .env.example          # Environment variables template
├── docker-compose.yml    # Full stack container orchestration
└── README.md             # Project documentation
```

---

## Database Schema & APIs

### Primary Backend REST APIs
- `GET /api/health` - Backend health verification
- `GET /api/machines` - List all registered industrial assets
- `GET /api/machines/{id}` - Fetch machine details and status
- `POST /api/machines` - Register a new machine asset
- `PUT /api/machines/{id}` - Update machine details
- `DELETE /api/machines/{id}` - Remove a machine asset
- `GET /api/sensors` - List registered sensors
- `GET /api/sensors/{id}` - Fetch sensor details
- `POST /api/sensors` - Register new sensor on a machine
- `PUT /api/sensors/{id}` - Update sensor parameters
- `GET /api/sensor-readings` - Query paginated telemetry readings
- `GET /api/sensor-readings/{sensorId}` - Query paginated readings for a specific sensor

---

## Setup & Quickstart

### Option 1: Docker Compose (Recommended)
```bash
docker-compose up -d --build
```

### Option 2: Local Microservices Setup

#### 1. Backend (Java 21 / Spring Boot 3)
```bash
cd backend
./mvnw clean package -DskipTests
java -jar target/predictive-maintenance-backend-0.0.1-SNAPSHOT.jar
```

#### 2. ML Service (Python 3.11+)
```bash
cd ml-service
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### 3. Frontend (Node.js / React)
```bash
cd frontend
npm install
npm run dev
```

---

## Development Roadmap

- [x] Monorepo initialization & docker orchestration setup
- [x] PostgreSQL relational schema & indexed persistence model
- [x] Spring Boot 3 backend base foundation & REST API controllers
- [x] FastAPI ML service health & model endpoint architecture
- [x] React dashboard landing page & telemetry status visualization
- [ ] Real-time MQTT stream ingestion pipeline integration
- [ ] Scikit-learn model training on industrial vibration & thermal datasets
- [ ] Automated maintenance work order dispatching system
