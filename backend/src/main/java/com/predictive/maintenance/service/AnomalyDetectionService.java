package com.predictive.maintenance.service;

import com.predictive.maintenance.dto.AnomalyPredictionResponseDTO;
import com.predictive.maintenance.dto.ImportantFeatureDTO;
import com.predictive.maintenance.entity.Alert;
import com.predictive.maintenance.entity.Machine;
import com.predictive.maintenance.entity.Prediction;
import com.predictive.maintenance.entity.SensorReading;
import com.predictive.maintenance.repository.AlertRepository;
import com.predictive.maintenance.repository.MachineRepository;
import com.predictive.maintenance.repository.PredictionRepository;
import com.predictive.maintenance.repository.SensorReadingRepository;
import com.predictive.maintenance.repository.SensorRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnomalyDetectionService {

    private static final Logger log = LoggerFactory.getLogger(AnomalyDetectionService.class);

    private final MachineRepository machineRepository;
    private final SensorRepository sensorRepository;
    private final SensorReadingRepository sensorReadingRepository;
    private final PredictionRepository predictionRepository;
    private final AlertRepository alertRepository;
    private final MlClientService mlClientService;

    @Transactional
    public AnomalyPredictionResponseDTO evaluateMachineTelemetry(Long machineId) {
        Machine machine = machineRepository.findById(machineId)
                .orElseThrow(() -> new RuntimeException("Machine not found with ID: " + machineId));

        // 1. Gather recent telemetry readings for machine sensors
        List<Map<String, Object>> telemetryPayload = buildTelemetryPayloadForMachine(machine);

        // 2. Call ML Service for Isolation Forest Anomaly Prediction
        AnomalyPredictionResponseDTO predictionDTO = mlClientService.getAnomalyPrediction(
                machine.getMachineCode(), telemetryPayload
        );

        // 3. Persist Prediction Entity to PostgreSQL
        double failureProb = Math.min(0.99, predictionDTO.getAnomalyScore() * 1.15);
        double rulHours = Math.max(12.0, 500.0 * (1.0 - predictionDTO.getAnomalyScore()));

        Prediction prediction = Prediction.builder()
                .machine(machine)
                .anomalyScore(predictionDTO.getAnomalyScore())
                .failureProbability(failureProb)
                .predictedRulHours(rulHours)
                .modelVersion(predictionDTO.getModelVersion())
                .predictionTime(LocalDateTime.now())
                .build();

        predictionRepository.save(prediction);
        log.info("Saved ML Prediction for machine [{}]: Score={}, ModelVersion={}",
                machine.getMachineCode(), predictionDTO.getAnomalyScore(), predictionDTO.getModelVersion());

        // 4. Alert Creation & Ongoing Condition Deduplication Check
        boolean isAnomalous = "ANOMALOUS".equalsIgnoreCase(predictionDTO.getStatus())
                || predictionDTO.getAnomalyScore() >= 0.70;

        if (isAnomalous) {
            handleAnomalousCondition(machine, predictionDTO);
        }

        return predictionDTO;
    }

    private void handleAnomalousCondition(Machine machine, AnomalyPredictionResponseDTO predictionDTO) {
        // Deduplication Check: Search for unacknowledged active alerts for this machine
        List<Alert> existingActiveAlerts = alertRepository.findByMachineIdAndIsAcknowledgedFalse(machine.getId());

        if (!existingActiveAlerts.isEmpty()) {
            log.info("Skipped creating duplicate alert for machine [{}]. Active unacknowledged alert already exists for ongoing condition.",
                    machine.getMachineCode());
            return;
        }

        // Format top features for alert message
        String featuresSummary = "";
        if (predictionDTO.getImportantFeatures() != null && !predictionDTO.getImportantFeatures().isEmpty()) {
            featuresSummary = " [Contributing Features: " + predictionDTO.getImportantFeatures().stream()
                    .map(f -> f.getFeature() + " (" + String.format(Locale.US, "%.0f%%", f.getScore() * 100) + ")")
                    .collect(Collectors.joining(", ")) + "]";
        }

        String alertMsg = String.format(Locale.US, "AI Anomaly Detected on %s! Anomaly Score: %.2f%s",
                machine.getMachineCode(), predictionDTO.getAnomalyScore(), featuresSummary);

        Alert alert = Alert.builder()
                .machine(machine)
                .severity("CRITICAL")
                .alertMessage(alertMsg)
                .isAcknowledged(false)
                .triggeredAt(LocalDateTime.now())
                .build();

        alertRepository.save(alert);
        log.warn("Triggered new CRITICAL AI Anomaly Alert for machine [{}]: {}", machine.getMachineCode(), alertMsg);

        // Update machine status if currently nominal
        if ("RUNNING".equalsIgnoreCase(machine.getStatus()) || "IDLE".equalsIgnoreCase(machine.getStatus())) {
            machine.setStatus("CRITICAL");
            machineRepository.save(machine);
        }
    }

    private List<Map<String, Object>> buildTelemetryPayloadForMachine(Machine machine) {
        List<Map<String, Object>> payload = new ArrayList<>();
        List<com.predictive.maintenance.entity.Sensor> sensors = sensorRepository.findByMachineId(machine.getId());
        if (sensors == null || sensors.isEmpty()) {
            return payload;
        }

        // Gather latest readings across machine sensors
        Map<String, Object> latestItem = new HashMap<>();
        latestItem.put("machineId", machine.getMachineCode());
        latestItem.put("timestamp", LocalDateTime.now().toString());

        for (var sensor : sensors) {
            var readings = sensorReadingRepository.findBySensorId(
                    sensor.getId(), PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "timestamp"))
            );
            if (readings.hasContent()) {
                SensorReading r = readings.getContent().get(0);
                String stype = sensor.getSensorType().toLowerCase();
                latestItem.put(stype, r.getValue());
            }
        }

        // Provide nominal fallbacks if missing
        latestItem.putIfAbsent("temperature", 62.4);
        latestItem.putIfAbsent("vibration", 2.1);
        latestItem.putIfAbsent("pressure", 5.0);
        latestItem.putIfAbsent("rpm", 2990.0);
        latestItem.putIfAbsent("current", 12.5);
        latestItem.putIfAbsent("voltage", 400.0);

        payload.add(latestItem);
        return payload;
    }
}
