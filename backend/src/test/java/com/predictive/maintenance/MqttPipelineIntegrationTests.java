package com.predictive.maintenance;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.predictive.maintenance.dto.MqttTelemetryPayloadDTO;
import com.predictive.maintenance.dto.SensorReadingResponseDTO;
import com.predictive.maintenance.entity.Machine;
import com.predictive.maintenance.entity.Sensor;
import com.predictive.maintenance.entity.SensorReading;
import com.predictive.maintenance.repository.MachineRepository;
import com.predictive.maintenance.repository.SensorReadingRepository;
import com.predictive.maintenance.repository.SensorRepository;
import com.predictive.maintenance.service.MqttTelemetryIngestionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class MqttPipelineIntegrationTests {

    @Autowired
    private MqttTelemetryIngestionService telemetryIngestionService;

    @Autowired
    private MachineRepository machineRepository;

    @Autowired
    private SensorRepository sensorRepository;

    @Autowired
    private SensorReadingRepository sensorReadingRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private Machine testMachine;

    @BeforeEach
    void setUp() {
        testMachine = machineRepository.save(Machine.builder()
                .machineCode("MCH-MQTT-001")
                .machineName("MQTT Ingestion Lathe")
                .machineType("Lathe")
                .status("RUNNING")
                .criticality("HIGH")
                .build());
    }

    @Test
    void testValidMqttPayloadProcessingAndAutoSensorRegistration() throws Exception {
        String timestampStr = Instant.now().toString();

        MqttTelemetryPayloadDTO payload = MqttTelemetryPayloadDTO.builder()
                .machineId("MCH-MQTT-001")
                .sensorId("SNR-TEMP-MQTT-01")
                .sensorType("TEMPERATURE")
                .value(68.5)
                .unit("°C")
                .timestamp(timestampStr)
                .build();

        String jsonPayload = objectMapper.writeValueAsString(payload);
        String topic = "factory/MCH-MQTT-001/sensor/temperature";

        SensorReadingResponseDTO result = telemetryIngestionService.processTelemetryPayload(topic, jsonPayload);

        assertNotNull(result);
        assertEquals(68.5, result.getValue());
        assertEquals("°C", result.getUnit());
        assertEquals("SNR-TEMP-MQTT-01", result.getSensorCode());

        // Verify Sensor Auto-registration in DB
        Sensor registeredSensor = sensorRepository.findBySensorCode("SNR-TEMP-MQTT-01").orElse(null);
        assertNotNull(registeredSensor);
        assertEquals(testMachine.getId(), registeredSensor.getMachine().getId());

        // Verify SensorReading DB record
        Page<SensorReading> page = sensorReadingRepository.findBySensorId(registeredSensor.getId(), PageRequest.of(0, 10));
        assertFalse(page.getContent().isEmpty());
        assertEquals(68.5, page.getContent().get(0).getValue());
    }

    @Test
    void testDuplicatePayloadDeduplication() throws Exception {
        String timestampStr = Instant.now().toString();

        MqttTelemetryPayloadDTO payload = MqttTelemetryPayloadDTO.builder()
                .machineId("MCH-MQTT-001")
                .sensorId("SNR-VIB-MQTT-01")
                .sensorType("VIBRATION")
                .value(2.4)
                .unit("mm/s")
                .timestamp(timestampStr)
                .build();

        String jsonPayload = objectMapper.writeValueAsString(payload);
        String topic = "factory/MCH-MQTT-001/sensor/vibration";

        // First Ingestion
        SensorReadingResponseDTO firstResult = telemetryIngestionService.processTelemetryPayload(topic, jsonPayload);
        assertNotNull(firstResult);

        // Duplicate Ingestion with identical timestamp and value
        SensorReadingResponseDTO duplicateResult = telemetryIngestionService.processTelemetryPayload(topic, jsonPayload);
        assertNull(duplicateResult, "Duplicate payload should be ignored and return null");
    }

    @Test
    void testUnknownMachineRejection() throws Exception {
        MqttTelemetryPayloadDTO payload = MqttTelemetryPayloadDTO.builder()
                .machineId("MCH-UNKNOWN-999")
                .sensorId("SNR-UNKNOWN-01")
                .sensorType("PRESSURE")
                .value(5.0)
                .unit("bar")
                .timestamp(Instant.now().toString())
                .build();

        String jsonPayload = objectMapper.writeValueAsString(payload);
        String topic = "factory/MCH-UNKNOWN-999/sensor/pressure";

        SensorReadingResponseDTO result = telemetryIngestionService.processTelemetryPayload(topic, jsonPayload);
        assertNull(result, "Unknown machine should be rejected cleanly and return null");
    }

    @Test
    void testInvalidJsonPayloadHandling() {
        String invalidJson = "{ invalid_json_payload: missing_quotes ";
        String topic = "factory/MCH-MQTT-001/sensor/temperature";

        SensorReadingResponseDTO result = telemetryIngestionService.processTelemetryPayload(topic, invalidJson);
        assertNull(result, "Malformed JSON payload should be rejected cleanly and return null");
    }

    @Test
    void testMissingAttributesValidation() throws Exception {
        // Missing machineId
        MqttTelemetryPayloadDTO payload = MqttTelemetryPayloadDTO.builder()
                .sensorType("RPM")
                .value(3000.0)
                .build();

        String jsonPayload = objectMapper.writeValueAsString(payload);
        String topic = "factory/MCH-MQTT-001/sensor/rpm";

        SensorReadingResponseDTO result = telemetryIngestionService.processTelemetryPayload(topic, jsonPayload);
        assertNull(result, "Payload missing machineId should be rejected cleanly");
    }
}
