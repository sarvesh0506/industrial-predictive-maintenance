# AI-Powered Industrial Predictive Maintenance & Asset Intelligence Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()
[![Java](https://img.shields.io/badge/Java-21-orange.svg)]()
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-green.svg)]()
[![React](https://img.shields.io/badge/React-18-blue.svg)]()
[![FastAPI](https://img.shields.io/badge/FastAPI-Python%203.11+-009688.svg)]()
[![Docker](https://img.shields.io/badge/Docker-Containerized-blue.svg)]()

> AI-powered industrial predictive maintenance platform for real-time machine monitoring, anomaly detection, failure prediction, RUL (Remaining Useful Life) estimation, intelligent maintenance management, and industrial analytics using IoT, ML, and full-stack containerized microservices.

---

## Table of Contents
- [Project Overview](#project-overview)
- [Architecture & Containerized Pipeline](#architecture--containerized-pipeline)
- [Container Microservices](#container-microservices)
- [Technology Stack](#technology-stack)
- [Module Structure](#module-structure)
- [Setup & Docker Quickstart](#setup--docker-quickstart)
- [API Reference](#api-reference)

---

## Project Overview

Unplanned industrial machine breakdowns cause billions of dollars in lost productivity and unexpected asset damage annually. **AI-Powered Industrial Predictive Maintenance & Asset Intelligence Platform** combines real-time IoT sensor telemetry ingestion, machine learning failure prediction, Isolation Forest anomaly detection, Remaining Useful Life (RUL) regression, and interactive dashboard monitoring to shift industrial operations from reactive maintenance to proactive asset intelligence.

---

## Architecture & Containerized Pipeline

```
                       +---------------------------+
                       |  Industrial IoT Simulator | (ipm-simulator)
                       | (Sensors: Temp/Vib/Press) |
                       +-------------+-------------+
                                     |
                                     v [MQTT tcp://mqtt:1883]
                       +-------------+-------------+
                       |   Eclipse Mosquitto Broker | (ipm-mqtt)
                       +-------------+-------------+
                                     |
                                     v
+------------------+        +--------+--------+        +-------------------+
|  React Dashboard | <----> |   Spring Boot   | <----> |  PostgreSQL DB    | (ipm-postgres)
|  (ipm-frontend)  |  HTTP  |   Backend API   |  JPA   |  (Assets/Readings)|
+------------------+  /WS   |  (ipm-backend)  |        +-------------------+
                            +--------+--------+
                                     |
                                     v REST [http://ml-service:8000]
                            +--------+--------+
                            |  FastAPI ML     | (ipm-ml-service)
                            |  Inference Engine|
                            +-----------------+
```

---

## Container Microservices

| Service | Container Name | Port | Description |
| :--- | :--- | :--- | :--- |
| **Database** | `ipm-postgres` | `5432` | PostgreSQL 16 database with persistent storage and relational index optimizations |
| **MQTT Broker** | `ipm-mqtt` | `1883`, `9001` | Eclipse Mosquitto MQTT broker for high-throughput sensor telemetry ingestion |
| **ML Service** | `ipm-ml-service` | `8000` | FastAPI Python service executing Isolation Forest anomaly detection & failure prediction |
| **Backend API** | `ipm-backend` | `8080` | Spring Boot 3 Java 21 REST API, JWT authentication, RBAC, WebSocket STOMP server |
| **Frontend** | `ipm-frontend` | `3000` | React 18 dashboard served via Nginx with API & WebSocket proxying |
| **Simulator** | `ipm-simulator` | - | Python telemetry stream simulator generating physics-based machine noise & failures |

---

## Setup & Docker Quickstart

### 1. Launch Platform with Docker Compose

To build and start all containerized microservices:

```bash
docker compose build
docker compose up -d
```

### 2. Service Access Points

- **React Dashboard UI**: [http://localhost:3000](http://localhost:3000)
- **Spring Boot Backend REST API**: [http://localhost:8080/api](http://localhost:8080/api)
- **Python ML Inference Engine**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **MQTT Broker**: `localhost:1883`

---

## Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Recharts, SockJS WebSocket.
- **Backend**: Java 21, Spring Boot 3.x, Spring Data JPA, Spring Security, JWT, Maven.
- **ML Engine**: Python 3.11+, FastAPI, scikit-learn, pandas, numpy, joblib.
- **IoT & Telemetry**: MQTT (Eclipse Mosquitto), WebSocket STOMP.
- **Database**: PostgreSQL 16 with composite indexes.
- **Orchestration**: Docker, Docker Compose, Nginx.
