package com.predictive.maintenance.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "sensor_threshold_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SensorThresholdConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sensor_type", nullable = false, unique = true, length = 50)
    private String sensorType; // TEMPERATURE, VIBRATION, PRESSURE, RPM, CURRENT, VOLTAGE

    @Column(name = "warning_min")
    private Double warningMin;

    @Column(name = "warning_max")
    private Double warningMax;

    @Column(name = "critical_min")
    private Double criticalMin;

    @Column(name = "critical_max")
    private Double criticalMax;

    @Column(length = 20)
    private String unit;
}
