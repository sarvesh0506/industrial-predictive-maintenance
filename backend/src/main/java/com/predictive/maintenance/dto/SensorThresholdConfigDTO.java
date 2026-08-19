package com.predictive.maintenance.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SensorThresholdConfigDTO {
    private Long id;
    private String sensorType;
    private Double warningMin;
    private Double warningMax;
    private Double criticalMin;
    private Double criticalMax;
    private String unit;
}
