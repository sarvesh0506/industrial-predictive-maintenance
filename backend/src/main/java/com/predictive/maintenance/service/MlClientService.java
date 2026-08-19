package com.predictive.maintenance.service;

import com.predictive.maintenance.dto.AnomalyPredictionResponseDTO;
import com.predictive.maintenance.dto.ImportantFeatureDTO;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class MlClientService {

    private static final Logger log = LoggerFactory.getLogger(MlClientService.class);
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.ml-service.url:http://localhost:8000}")
    private String mlServiceUrl;

    public AnomalyPredictionResponseDTO getAnomalyPrediction(String machineCode, List<Map<String, Object>> telemetryReadings) {
        String endpoint = mlServiceUrl + "/ml/anomaly/predict";

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("readings", telemetryReadings);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            AnomalyPredictionResponseDTO response = restTemplate.postForObject(endpoint, entity, AnomalyPredictionResponseDTO.class);

            if (response != null) {
                log.info("Received ML Anomaly Prediction for Machine [{}]: Score={}, Status={}",
                        machineCode, response.getAnomalyScore(), response.getStatus());
                return response;
            }
        } catch (Exception e) {
            log.warn("Failed to reach Python ML Service at [{}]. Fallback evaluation applied. Reason: {}",
                    endpoint, e.getMessage());
        }

        // Fallback rule evaluation if FastAPI microservice is offline
        return fallbackAnomalyEvaluation(machineCode, telemetryReadings);
    }

    private AnomalyPredictionResponseDTO fallbackAnomalyEvaluation(String machineCode, List<Map<String, Object>> telemetryReadings) {
        double maxTemp = 60.0;
        double maxVib = 1.8;

        if (telemetryReadings != null && !telemetryReadings.isEmpty()) {
            Map<String, Object> latest = telemetryReadings.get(telemetryReadings.size() - 1);
            if (latest.get("temperature") != null) maxTemp = Double.parseDouble(latest.get("temperature").toString());
            if (latest.get("vibration") != null) maxVib = Double.parseDouble(latest.get("vibration").toString());
        }

        double anomalyScore = 0.15;
        String status = "NORMAL";
        List<ImportantFeatureDTO> features = new ArrayList<>();

        if (maxVib > 10.0 || maxTemp > 90.0) {
            anomalyScore = 0.88;
            status = "ANOMALOUS";
            features.add(new ImportantFeatureDTO("vibration_trend", 0.60));
            features.add(new ImportantFeatureDTO("temperature_mean", 0.35));
        } else if (maxVib > 4.0 || maxTemp > 75.0) {
            anomalyScore = 0.55;
            status = "WARNING";
            features.add(new ImportantFeatureDTO("vibration_mean", 0.50));
        }

        return AnomalyPredictionResponseDTO.builder()
                .machineId(machineCode)
                .timestamp(Instant.now().toString())
                .anomalyScore(anomalyScore)
                .status(status)
                .importantFeatures(features)
                .modelVersion("v1.0-IsolationForest (Fallback)")
                .build();
    }
}
