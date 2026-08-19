package com.predictive.maintenance.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MqttTelemetryPayloadDTO {
    private String machineId;
    private String sensorId;
    private String sensorType;
    private Double value;
    private String unit;
    private String timestamp;
}
