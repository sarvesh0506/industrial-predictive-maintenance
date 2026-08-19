package com.predictive.maintenance;

import com.predictive.maintenance.dto.RulPredictionResponseDTO;
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
class RulPredictionIntegrationTests {

    @Autowired
    private MlClientService mlClientService;

    @Autowired
    private MachineRepository machineRepository;

    private Machine testMachine;

    @BeforeEach
    void setUp() {
        testMachine = machineRepository.save(Machine.builder()
                .machineCode("MCH-RUL-TEST-01")
                .machineName("RUL Test Lathe")
                .machineType("Lathe")
                .status("RUNNING")
                .criticality("MEDIUM")
                .build());
    }

    @Test
    void testRulPredictionNominalEvaluation() {
        List<Map<String, Object>> readings = new ArrayList<>();
        Map<String, Object> item = new HashMap<>();
        item.put("machineId", "MCH-RUL-TEST-01");
        item.put("temperature", 60.5);
        item.put("vibration", 1.8);
        readings.add(item);

        RulPredictionResponseDTO result = mlClientService.getRulPrediction("MCH-RUL-TEST-01", readings);

        assertNotNull(result);
        assertEquals("MCH-RUL-TEST-01", result.getMachineId());
        assertTrue(result.getEstimatedRemainingHours() > 300.0);
        assertTrue(result.getConfidenceOrUncertainty() >= 0.70);
        assertNotNull(result.getDisclaimer());
        assertTrue(result.getDisclaimer().contains("AI estimate"));
    }

    @Test
    void testRulPredictionDegradedSpikeEvaluation() {
        List<Map<String, Object>> readings = new ArrayList<>();
        Map<String, Object> item = new HashMap<>();
        item.put("machineId", "MCH-RUL-TEST-01");
        item.put("temperature", 78.0);
        item.put("vibration", 5.5); // Elevated degradation
        readings.add(item);

        RulPredictionResponseDTO result = mlClientService.getRulPrediction("MCH-RUL-TEST-01", readings);

        assertNotNull(result);
        assertTrue(result.getEstimatedRemainingHours() <= 200.0);
        assertNotNull(result.getDisclaimer());
    }
}
