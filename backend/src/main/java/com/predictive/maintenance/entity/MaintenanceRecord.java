package com.predictive.maintenance.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "maintenance_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "machine_id", nullable = false)
    private Machine machine;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by_user_id")
    private User performedBy;

    @Column(name = "task_title", length = 150)
    private String taskTitle;

    @Column(name = "maintenance_type", nullable = false, length = 50)
    private String maintenanceType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 30)
    private String status; // OPEN, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED

    @Column(nullable = false, length = 30)
    private String priority; // LOW, MEDIUM, HIGH, CRITICAL

    @Column(name = "assigned_engineer", length = 100)
    private String assignedEngineer;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Column(name = "serviced_at")
    private LocalDateTime servicedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(precision = 10, scale = 2)
    private BigDecimal cost;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "ai_recommended", nullable = false)
    private Boolean aiRecommended = false;

    @Column(name = "recommendation_reason", columnDefinition = "TEXT")
    private String recommendationReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = "OPEN";
        }
        if (this.priority == null) {
            this.priority = "MEDIUM";
        }
        if (this.aiRecommended == null) {
            this.aiRecommended = false;
        }
        if (this.servicedAt == null) {
            this.servicedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
