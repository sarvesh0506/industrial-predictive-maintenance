package com.predictive.maintenance.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "alerts",
    indexes = {
        @Index(name = "idx_alerts_machine_status", columnList = "machine_id, status"),
        @Index(name = "idx_alerts_severity", columnList = "severity"),
        @Index(name = "idx_alerts_triggered_at", columnList = "triggered_at DESC")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "machine_id", nullable = false)
    private Machine machine;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sensor_id")
    private Sensor sensor;

    @Column(name = "alert_source", nullable = false, length = 50)
    private String alertSource; // SENSOR_THRESHOLD, ANOMALY_DETECTION, FAILURE_PREDICTION, RUL_WARNING, MACHINE_OFFLINE, OVERDUE_MAINTENANCE

    @Column(nullable = false, length = 20)
    private String severity; // INFO, WARNING, CRITICAL

    @Column(name = "alert_message", nullable = false, length = 255)
    private String alertMessage;

    @Column(nullable = false, length = 30)
    private String status; // ACTIVE, ACKNOWLEDGED, RESOLVED

    @Column(name = "is_acknowledged", nullable = false)
    private Boolean isAcknowledged = false;

    @Column(name = "acknowledged_by", length = 100)
    private String acknowledgedBy;

    @Column(name = "acknowledged_at")
    private LocalDateTime acknowledgedAt;

    @Column(name = "resolved_by", length = 100)
    private String resolvedBy;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "triggered_at", nullable = false, updatable = false)
    private LocalDateTime triggeredAt;

    @PrePersist
    protected void onCreate() {
        this.triggeredAt = LocalDateTime.now();
        if (this.isAcknowledged == null) this.isAcknowledged = false;
        if (this.severity == null) this.severity = "WARNING";
        if (this.status == null) this.status = "ACTIVE";
        if (this.alertSource == null) this.alertSource = "SENSOR_THRESHOLD";
    }
}
