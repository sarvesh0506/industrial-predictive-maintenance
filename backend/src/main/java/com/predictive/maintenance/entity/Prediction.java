package com.predictive.maintenance.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "predictions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Prediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "machine_id", nullable = false)
    private Machine machine;

    @Column(name = "failure_probability", nullable = false)
    private Double failureProbability;

    @Column(name = "predicted_rul_hours", nullable = false)
    private Double predictedRulHours;

    @Column(name = "anomaly_score")
    private Double anomalyScore;

    @Column(name = "prediction_time", nullable = false, updatable = false)
    private LocalDateTime predictionTime;

    @Column(name = "model_version", length = 50)
    private String modelVersion;

    @PrePersist
    protected void onCreate() {
        if (this.predictionTime == null) {
            this.predictionTime = LocalDateTime.now();
        }
    }
}
