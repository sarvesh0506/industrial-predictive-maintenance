package com.predictive.maintenance.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnomalyPredictionResponseDTO {
    private String machineId;
    private String timestamp;
    private Double anomalyScore;
    private String status;
    private List<ImportantFeatureDTO> importantFeatures;
    private String modelVersion;
}
