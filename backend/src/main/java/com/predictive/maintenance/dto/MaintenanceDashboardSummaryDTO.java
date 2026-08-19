package com.predictive.maintenance.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceDashboardSummaryDTO {
    private long overdueCount;
    private long upcomingCount;
    private long completedCount;
    private long criticalCount;
}
