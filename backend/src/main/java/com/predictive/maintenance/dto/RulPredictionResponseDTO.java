package com.predictive.maintenance.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RulPredictionResponseDTO {
    private String machineId;
    private Double estimatedRemainingHours;
    private Double confidenceOrUncertainty;
    private String timestamp;
    private String modelVersion;
    private String disclaimer;
}
