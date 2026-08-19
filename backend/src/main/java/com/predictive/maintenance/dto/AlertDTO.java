package com.predictive.maintenance.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertDTO {
    private Long id;
    private Long machineId;
    private String machineCode;
    private String machineName;
    private Long sensorId;
    private String sensorCode;
    private String alertSource; // SENSOR_THRESHOLD, ANOMALY_DETECTION, FAILURE_PREDICTION, RUL_WARNING, MACHINE_OFFLINE, OVERDUE_MAINTENANCE
    private String severity; // INFO, WARNING, CRITICAL
    private String alertMessage;
    private String status; // ACTIVE, ACKNOWLEDGED, RESOLVED
    private Boolean isAcknowledged;
    private String acknowledgedBy;
    private LocalDateTime acknowledgedAt;
    private String resolvedBy;
    private LocalDateTime resolvedAt;
    private LocalDateTime triggeredAt;
}
