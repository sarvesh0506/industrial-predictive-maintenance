package com.predictive.maintenance.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SensorResponseDTO {
    private Long id;
    private String sensorCode;
    private String sensorType;
    private Long machineId;
    private String machineCode;
    private String machineName;
    private String unit;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
