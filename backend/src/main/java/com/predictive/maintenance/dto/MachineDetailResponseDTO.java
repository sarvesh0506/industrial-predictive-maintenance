package com.predictive.maintenance.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MachineDetailResponseDTO {

    private Long id;
    private String machineCode;
    private String machineName;
    private String machineType;
    private String location;
    private String manufacturer;
    private String model;
    private LocalDate installationDate;
    private String status;
    private String criticality;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Double healthScore;
    private List<SensorDetailItemDTO> sensors;
    private List<AlertItemDTO> activeAlerts;
    private List<MaintenanceRecordItemDTO> maintenanceHistory;
    private List<PredictionItemDTO> predictions;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SensorDetailItemDTO {
        private Long id;
        private String sensorCode;
        private String sensorType;
        private String unit;
        private String status;
        private Double latestValue;
        private LocalDateTime latestTimestamp;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AlertItemDTO {
        private Long id;
        private String severity;
        private String alertMessage;
        private Boolean isAcknowledged;
        private LocalDateTime triggeredAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MaintenanceRecordItemDTO {
        private Long id;
        private String maintenanceType;
        private String description;
        private LocalDateTime servicedAt;
        private BigDecimal cost;
        private String performedByUsername;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PredictionItemDTO {
        private Long id;
        private Double failureProbability;
        private Double predictedRulHours;
        private Double anomalyScore;
        private LocalDateTime predictionTime;
        private String modelVersion;
    }
}
