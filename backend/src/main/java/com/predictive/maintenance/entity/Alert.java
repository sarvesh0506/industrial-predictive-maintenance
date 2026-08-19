package com.predictive.maintenance.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "alerts")
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

    @Column(nullable = false, length = 20)
    private String severity;

    @Column(name = "alert_message", nullable = false, length = 255)
    private String alertMessage;

    @Column(name = "is_acknowledged", nullable = false)
    private Boolean isAcknowledged;

    @Column(name = "triggered_at", nullable = false, updatable = false)
    private LocalDateTime triggeredAt;

    @PrePersist
    protected void onCreate() {
        this.triggeredAt = LocalDateTime.now();
        if (this.isAcknowledged == null) this.isAcknowledged = false;
        if (this.severity == null) this.severity = "WARNING";
    }
}
