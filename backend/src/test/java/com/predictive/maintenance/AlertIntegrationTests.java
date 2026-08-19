package com.predictive.maintenance;

import com.predictive.maintenance.dto.AlertDTO;
import com.predictive.maintenance.dto.SensorThresholdConfigDTO;
import com.predictive.maintenance.entity.Machine;
import com.predictive.maintenance.entity.Sensor;
import com.predictive.maintenance.repository.MachineRepository;
import com.predictive.maintenance.repository.SensorRepository;
import com.predictive.maintenance.service.AlertService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AlertIntegrationTests {

    @Autowired
    private AlertService alertService;

    @Autowired
    private MachineRepository machineRepository;

    @Autowired
    private SensorRepository sensorRepository;

    private Machine testMachine;
    private Sensor testSensor;

    @BeforeEach
    void setUp() {
        testMachine = machineRepository.save(Machine.builder()
                .machineCode("MCH-ALERT-TEST-01")
                .machineName("Alert Test Lathe")
                .machineType("Lathe")
                .status("RUNNING")
                .criticality("CRITICAL")
                .build());

        testSensor = sensorRepository.save(Sensor.builder()
                .sensorCode("SNR-TEMP-ALERT-01")
                .sensorType("TEMPERATURE")
                .machine(testMachine)
                .unit("°C")
                .status("ACTIVE")
                .build());
    }

    @Test
    void testAlertCreationAndDuplicatePrevention() {
        AlertDTO dto = AlertDTO.builder()
                .machineId(testMachine.getId())
                .sensorId(testSensor.getId())
                .alertSource("ANOMALY_DETECTION")
                .severity("CRITICAL")
                .alertMessage("AI Isolation Forest Anomaly Detected (Score: 0.88)")
                .build();

        AlertDTO created = alertService.createAlert(dto);
        assertNotNull(created.getId());
        assertEquals("ACTIVE", created.getStatus());
        assertEquals("CRITICAL", created.getSeverity());

        // Duplicate Check: Attempt duplicate creation for same machine & source
        AlertDTO duplicate = alertService.createAlert(dto);
        assertEquals(created.getId(), duplicate.getId()); // Duplicate skipped, returns existing
    }

    @Test
    void testAcknowledgeAndResolveWorkflow() {
        AlertDTO dto = AlertDTO.builder()
                .machineId(testMachine.getId())
                .alertSource("SENSOR_THRESHOLD")
                .severity("WARNING")
                .alertMessage("High Temperature Warning on MCH-ALERT-TEST-01 (78.5 °C)")
                .build();

        AlertDTO created = alertService.createAlert(dto);

        // Acknowledge
        AlertDTO acked = alertService.acknowledgeAlert(created.getId(), "operator.sarvesh");
        assertTrue(acked.getIsAcknowledged());
        assertEquals("ACKNOWLEDGED", acked.getStatus());
        assertEquals("operator.sarvesh", acked.getAcknowledgedBy());

        // Resolve
        AlertDTO resolved = alertService.resolveAlert(created.getId(), "engineer.sarvesh");
        assertEquals("RESOLVED", resolved.getStatus());
        assertEquals("engineer.sarvesh", resolved.getResolvedBy());
    }

    @Test
    void testSensorReadingThresholdEvaluation() {
        // Value 92.5 °C exceeds Critical Max (90.0 °C)
        alertService.evaluateSensorReadingThresholds(testMachine, testSensor, 92.5);

        List<AlertDTO> alerts = alertService.getAlerts(null, null, null, testMachine.getId(), null);
        assertFalse(alerts.isEmpty());
        AlertDTO thresholdAlert = alerts.get(0);
        assertEquals("CRITICAL", thresholdAlert.getSeverity());
        assertEquals("SENSOR_THRESHOLD", thresholdAlert.getAlertSource());
        assertTrue(thresholdAlert.getAlertMessage().contains("Critical High TEMPERATURE"));
    }

    @Test
    void testThresholdConfigUpdate() {
        List<SensorThresholdConfigDTO> configs = alertService.getThresholdConfigs();
        assertFalse(configs.isEmpty());

        SensorThresholdConfigDTO updateDto = SensorThresholdConfigDTO.builder()
                .sensorType("TEMPERATURE")
                .warningMax(70.0)
                .criticalMax(85.0)
                .unit("°C")
                .build();

        SensorThresholdConfigDTO updated = alertService.updateThresholdConfig(updateDto);
        assertEquals(70.0, updated.getWarningMax());
        assertEquals(85.0, updated.getCriticalMax());
    }
}
