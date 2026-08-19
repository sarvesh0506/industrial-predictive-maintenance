package com.predictive.maintenance;

import com.predictive.maintenance.dto.FailurePredictionResponseDTO;
import com.predictive.maintenance.entity.Machine;
import com.predictive.maintenance.repository.MachineRepository;
import com.predictive.maintenance.service.MlClientService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class FailurePredictionIntegrationTests {

    @Autowired
    private MlClientService mlClientService;

    @Autowired
    private MachineRepository machineRepository;

    private Machine testMachine;

    @BeforeEach
    void setUp() {
        testMachine = machineRepository.save(Machine.builder()
                .machineCode("MCH-FAIL-TEST-01")
                .machineName("Failure Mode Test Lathe")
                .machineType("Lathe")
                .status("RUNNING")
                .criticality("HIGH")
                .build());
    }

    @Test
    void testFailurePredictionNominalEvaluation() {
        List<Map<String, Object>> readings = new ArrayList<>();
        Map<String, Object> item = new HashMap<>();
        item.put("machineId", "MCH-FAIL-TEST-01");
        item.put("temperature", 61.5);
        item.put("vibration", 1.8);
        readings.add(item);

        FailurePredictionResponseDTO result = mlClientService.getFailurePrediction("MCH-FAIL-TEST-01", readings);

        assertNotNull(result);
        assertEquals("MCH-FAIL-TEST-01", result.getMachineId());
        assertEquals("NORMAL", result.getPredictedFailureType());
        assertEquals("LOW", result.getRiskLevel());
        assertTrue(result.getFailureProbability() < 0.25);
        assertNotNull(result.getDisclaimer());
    }

    @Test
    void testFailurePredictionBearingDegradationSpike() {
        List<Map<String, Object>> readings = new ArrayList<>();
        Map<String, Object> item = new HashMap<>();
        item.put("machineId", "MCH-FAIL-TEST-01");
        item.put("temperature", 68.0);
        item.put("vibration", 18.5); // Spiking vibration
        readings.add(item);

        FailurePredictionResponseDTO result = mlClientService.getFailurePrediction("MCH-FAIL-TEST-01", readings);

        assertNotNull(result);
        assertEquals("BEARING_DEGRADATION", result.getPredictedFailureType());
        assertEquals("CRITICAL", result.getRiskLevel());
        assertTrue(result.getFailureProbability() >= 0.80);
        assertFalse(result.getImportantFeatures().isEmpty());
        assertNotNull(result.getDisclaimer());
    }
}
