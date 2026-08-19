package com.predictive.maintenance;

import com.predictive.maintenance.dto.AnomalyPredictionResponseDTO;
import com.predictive.maintenance.entity.Alert;
import com.predictive.maintenance.entity.Machine;
import com.predictive.maintenance.entity.Prediction;
import com.predictive.maintenance.entity.Sensor;
import com.predictive.maintenance.entity.SensorReading;
import com.predictive.maintenance.repository.AlertRepository;
import com.predictive.maintenance.repository.MachineRepository;
import com.predictive.maintenance.repository.PredictionRepository;
import com.predictive.maintenance.repository.SensorReadingRepository;
import com.predictive.maintenance.repository.SensorRepository;
import com.predictive.maintenance.service.AnomalyDetectionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AnomalyDetectionIntegrationTests {

    @Autowired
    private AnomalyDetectionService anomalyDetectionService;

    @Autowired
    private MachineRepository machineRepository;

    @Autowired
    private SensorRepository sensorRepository;

    @Autowired
    private SensorReadingRepository sensorReadingRepository;

    @Autowired
    private PredictionRepository predictionRepository;

    @Autowired
    private AlertRepository alertRepository;

    private Machine testMachine;

    @BeforeEach
    void setUp() {
        testMachine = machineRepository.save(Machine.builder()
                .machineCode("MCH-ANOMALY-001")
                .machineName("Anomaly Test Lathe")
                .machineType("Lathe")
                .status("RUNNING")
                .criticality("HIGH")
                .build());

        Sensor vibSensor = sensorRepository.save(Sensor.builder()
                .sensorCode("SNR-VIB-ANOMALY-01")
                .sensorType("VIBRATION")
                .machine(testMachine)
                .unit("mm/s")
                .status("ACTIVE")
                .build());

        // Save Spiking Vibration Reading
        sensorReadingRepository.save(SensorReading.builder()
                .sensor(vibSensor)
                .timestamp(LocalDateTime.now())
                .value(18.5) // Spiking vibration triggers fallback / ML anomaly
                .build());
    }

    @Test
    void testAnomalyEvaluationAndAlertCreation() {
        AnomalyPredictionResponseDTO result = anomalyDetectionService.evaluateMachineTelemetry(testMachine.getId());

        assertNotNull(result);
        assertEquals("MCH-ANOMALY-001", result.getMachineId());
        assertTrue(result.getAnomalyScore() >= 0.70);
        assertEquals("ANOMALOUS", result.getStatus());

        // Verify Prediction DB Persistence
        List<Prediction> predictions = predictionRepository.findByMachineId(
                testMachine.getId(), PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "predictionTime"))
        ).getContent();
        assertFalse(predictions.isEmpty());
        assertEquals(result.getAnomalyScore(), predictions.get(0).getAnomalyScore());

        // Verify Alert Creation
        List<Alert> alerts = alertRepository.findByMachineId(testMachine.getId());
        assertEquals(1, alerts.size());
        assertEquals("CRITICAL", alerts.get(0).getSeverity());
        assertFalse(alerts.get(0).getIsAcknowledged());
    }

    @Test
    void testDuplicateAlertPreventionForOngoingCondition() {
        // First Evaluation - Triggers Alert 1
        anomalyDetectionService.evaluateMachineTelemetry(testMachine.getId());
        List<Alert> alertsFirst = alertRepository.findByMachineId(testMachine.getId());
        assertEquals(1, alertsFirst.size());

        // Second Evaluation while condition remains ongoing and alert is unacknowledged
        anomalyDetectionService.evaluateMachineTelemetry(testMachine.getId());
        List<Alert> alertsSecond = alertRepository.findByMachineId(testMachine.getId());

        // Should NOT create duplicate alert
        assertEquals(1, alertsSecond.size(), "Duplicate alert creation must be prevented for ongoing condition");
    }

    @Test
    void testNominalConditionNoAlertTriggered() {
        Machine nominalMachine = machineRepository.save(Machine.builder()
                .machineCode("MCH-NOMINAL-002")
                .machineName("Nominal Press")
                .machineType("Press")
                .status("RUNNING")
                .criticality("LOW")
                .build());

        Sensor tempSensor = sensorRepository.save(Sensor.builder()
                .sensorCode("SNR-TEMP-NOMINAL-02")
                .sensorType("TEMPERATURE")
                .machine(nominalMachine)
                .unit("°C")
                .status("ACTIVE")
                .build());

        sensorReadingRepository.save(SensorReading.builder()
                .sensor(tempSensor)
                .timestamp(LocalDateTime.now())
                .value(60.0) // Nominal reading
                .build());

        AnomalyPredictionResponseDTO result = anomalyDetectionService.evaluateMachineTelemetry(nominalMachine.getId());

        assertNotNull(result);
        assertEquals("NORMAL", result.getStatus());
        assertTrue(result.getAnomalyScore() < 0.50);

        List<Alert> alerts = alertRepository.findByMachineId(nominalMachine.getId());
        assertTrue(alerts.isEmpty(), "Nominal readings should not trigger any alerts");
    }
}
