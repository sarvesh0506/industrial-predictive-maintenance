package com.predictive.maintenance.repository;

import com.predictive.maintenance.entity.SensorThresholdConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SensorThresholdConfigRepository extends JpaRepository<SensorThresholdConfig, Long> {
    Optional<SensorThresholdConfig> findBySensorType(String sensorType);
}
