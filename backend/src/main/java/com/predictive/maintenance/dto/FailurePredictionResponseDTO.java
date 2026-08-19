package com.predictive.maintenance.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FailurePredictionResponseDTO {
    private String machineId;
    private Double failureProbability;
    private String riskLevel; // LOW, MEDIUM, HIGH, CRITICAL
    private String predictedFailureType; // NORMAL, OVERHEATING, BEARING_DEGRADATION, PRESSURE_FAILURE, MOTOR_DEGRADATION
    private List<ImportantFeatureDTO> importantFeatures;
    private String timestamp;
    private String modelVersion;
    private String disclaimer;
}
