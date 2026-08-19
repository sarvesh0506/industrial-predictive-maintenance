package com.predictive.maintenance.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyticsSummaryDTO {

    private Double uptimePercentage;
    private Double downtimeHours;
    private Long maintenanceFrequency;
    private Long anomalyFrequency;
    private Double averageFailureRisk;
    private Double averageMachineHealth;
    private Double mtbfHours;
    private Double mttrHours;
    private String timeframeLabel;

    private List<TimeSeriesPoint> healthTrend;
    private List<TimeSeriesPoint> anomalyTrend;
    private List<MachineMetricItem> machineDowntimeList;
    private List<CategoryCountItem> maintenanceTypeBreakdown;
    private List<CategoryCountItem> riskDistribution;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TimeSeriesPoint {
        private String timestamp;
        private Double value;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MachineMetricItem {
        private String machineCode;
        private String machineName;
        private Double value;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CategoryCountItem {
        private String category;
        private Long count;
    }
}
