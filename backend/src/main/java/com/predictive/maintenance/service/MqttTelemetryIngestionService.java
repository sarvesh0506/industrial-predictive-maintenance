package com.predictive.maintenance.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.predictive.maintenance.dto.MqttTelemetryPayloadDTO;
import com.predictive.maintenance.dto.SensorReadingResponseDTO;
import com.predictive.maintenance.entity.Machine;
import com.predictive.maintenance.entity.Sensor;
import com.predictive.maintenance.entity.SensorReading;
import com.predictive.maintenance.repository.MachineRepository;
import com.predictive.maintenance.repository.SensorReadingRepository;
import com.predictive.maintenance.repository.SensorRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeParseException;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MqttTelemetryIngestionService {

    private static final Logger log = LoggerFactory.getLogger(MqttTelemetryIngestionService.class);
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    private final MachineRepository machineRepository;
    private final SensorRepository sensorRepository;
    private final SensorReadingRepository sensorReadingRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public SensorReadingResponseDTO processTelemetryPayload(String topic, String jsonPayload) {
        log.debug("Processing MQTT payload from topic [{}]: {}", topic, jsonPayload);

        if (jsonPayload == null || jsonPayload.trim().isEmpty()) {
            log.warn("Rejected empty or null MQTT payload from topic [{}]", topic);
            return null;
        }

        MqttTelemetryPayloadDTO payload;
        try {
            payload = objectMapper.readValue(jsonPayload, MqttTelemetryPayloadDTO.class);
        } catch (Exception e) {
            log.error("Invalid JSON payload structure on topic [{}]: {}. Exception: {}", topic, jsonPayload, e.getMessage());
            return null;
        }

        // Validate payload fields
        if (payload.getMachineId() == null || payload.getMachineId().trim().isEmpty() ||
            payload.getSensorType() == null || payload.getSensorType().trim().isEmpty() ||
            payload.getValue() == null) {
            log.warn("Validation failed for MQTT payload. Mandatory attributes missing: {}", jsonPayload);
            return null;
        }

        // Parse timestamp
        LocalDateTime timestamp = parseTimestamp(payload.getTimestamp());

        // Identify Machine
        String machineCode = payload.getMachineId().trim();
        Optional<Machine> machineOpt = machineRepository.findByMachineCode(machineCode);
        if (machineOpt.isEmpty()) {
            log.warn("Ingestion skipped: Unknown machine with code [{}] on topic [{}]", machineCode, topic);
            return null;
        }
        Machine machine = machineOpt.get();

        // Identify or Auto-register Sensor
        String sensorCode = (payload.getSensorId() != null && !payload.getSensorId().trim().isEmpty())
                ? payload.getSensorId().trim()
                : "SNR-" + payload.getSensorType().trim().toUpperCase() + "-" + machineCode;

        Sensor sensor = sensorRepository.findBySensorCode(sensorCode)
                .orElseGet(() -> {
                    log.info("Auto-registering missing sensor [{}] for machine [{}]", sensorCode, machineCode);
                    return sensorRepository.save(Sensor.builder()
                            .sensorCode(sensorCode)
                            .sensorType(payload.getSensorType().trim().toUpperCase())
                            .machine(machine)
                            .unit(payload.getUnit() != null ? payload.getUnit() : "unit")
                            .status("ACTIVE")
                            .build());
                });

        // Deduplication Check: Check if latest reading for sensor has identical timestamp
        Page<SensorReading> latestPage = sensorReadingRepository.findBySensorId(
                sensor.getId(), PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "timestamp"))
        );
        if (latestPage.hasContent()) {
            SensorReading latest = latestPage.getContent().get(0);
            if (latest.getTimestamp().equals(timestamp) && Double.valueOf(latest.getValue()).equals(payload.getValue())) {
                log.debug("Duplicate message detected for sensor [{}] at timestamp [{}]. Ignoring.", sensorCode, timestamp);
                return null;
            }
        }

        // Persist SensorReading into PostgreSQL
        SensorReading reading = SensorReading.builder()
                .sensor(sensor)
                .timestamp(timestamp)
                .value(payload.getValue())
                .build();

        SensorReading savedReading = sensorReadingRepository.save(reading);
        log.info("Successfully persisted telemetry reading for sensor [{}] (Machine: {}): {} {}", 
                sensorCode, machineCode, savedReading.getValue(), sensor.getUnit());

        // Build Response DTO
        SensorReadingResponseDTO responseDTO = SensorReadingResponseDTO.builder()
                .id(savedReading.getId())
                .sensorId(sensor.getId())
                .sensorCode(sensor.getSensorCode())
                .sensorType(sensor.getSensorType())
                .unit(sensor.getUnit())
                .timestamp(savedReading.getTimestamp())
                .value(savedReading.getValue())
                .build();

        // Broadcast through WebSocket STOMP broker
        try {
            messagingTemplate.convertAndSend("/topic/telemetry", responseDTO);
            messagingTemplate.convertAndSend("/topic/machines/" + machineCode, responseDTO);
            log.debug("Broadcasted telemetry reading over STOMP /topic/telemetry and /topic/machines/{}", machineCode);
        } catch (Exception e) {
            log.warn("WebSocket broadcast failed: {}", e.getMessage());
        }

        return responseDTO;
    }

    private LocalDateTime parseTimestamp(String rawTimestamp) {
        if (rawTimestamp == null || rawTimestamp.trim().isEmpty()) {
            return LocalDateTime.now();
        }
        try {
            return ZonedDateTime.parse(rawTimestamp).toLocalDateTime();
        } catch (DateTimeParseException e1) {
            try {
                return LocalDateTime.parse(rawTimestamp);
            } catch (DateTimeParseException e2) {
                return LocalDateTime.now();
            }
        }
    }
}
