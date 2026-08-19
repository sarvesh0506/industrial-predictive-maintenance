package com.predictive.maintenance.repository;

import com.predictive.maintenance.entity.SensorReading;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface SensorReadingRepository extends JpaRepository<SensorReading, Long> {
    Page<SensorReading> findBySensorId(Long sensorId, Pageable pageable);
    Page<SensorReading> findBySensorIdAndTimestampBetween(Long sensorId, LocalDateTime start, LocalDateTime end, Pageable pageable);
}
