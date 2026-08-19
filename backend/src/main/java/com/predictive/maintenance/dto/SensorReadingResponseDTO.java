package com.predictive.maintenance.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SensorReadingResponseDTO {
    private Long id;
    private Long sensorId;
    private String sensorCode;
    private String sensorType;
    private String unit;
    private LocalDateTime timestamp;
    private Double value;
}
