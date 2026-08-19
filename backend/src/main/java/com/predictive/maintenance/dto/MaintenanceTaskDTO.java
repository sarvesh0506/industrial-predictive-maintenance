package com.predictive.maintenance.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceTaskDTO {
    private Long id;
    private Long machineId;
    private String machineCode;
    private String machineName;
    private String taskTitle;
    private String maintenanceType; // PREVENTIVE, CORRECTIVE, INSPECTION, AI_RECOMMENDED
    private String description;
    private String status; // OPEN, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED
    private String priority; // LOW, MEDIUM, HIGH, CRITICAL
    private String assignedEngineer;
    private LocalDateTime dueDate;
    private LocalDateTime servicedAt;
    private LocalDateTime completedAt;
    private BigDecimal cost;
    private String notes;
    private Boolean aiRecommended;
    private String recommendationReason;
    private LocalDateTime createdAt;
}
