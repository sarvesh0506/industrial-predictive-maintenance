# System Design Specification

## Overview
The **Industrial Predictive Maintenance Platform** uses an event-driven and REST microservice architecture for real-time asset intelligence.

### Architectural Layers
1. **Edge Telemetry Layer**: IoT sensors and physical assets publishing telemetry to MQTT topics.
2. **Ingestion & Messaging Layer**: Eclipse Mosquitto MQTT broker transmitting streaming telemetry to Spring Boot backend services.
3. **Domain & Data Layer**: Spring Boot REST microservice processing operational entities, persistence via PostgreSQL.
4. **AI Analytics Layer**: Python FastAPI microservice providing anomaly detection scoring and Remaining Useful Life (RUL) predictions.
5. **Presentation Layer**: React single-page application rendering system health, telemetry charts, and actionable alerts.
