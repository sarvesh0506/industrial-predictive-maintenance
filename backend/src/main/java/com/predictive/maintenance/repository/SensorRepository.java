package com.predictive.maintenance.repository;

import com.predictive.maintenance.entity.Sensor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SensorRepository extends JpaRepository<Sensor, Long> {
    Optional<Sensor> findBySensorCode(String sensorCode);
    boolean existsBySensorCode(String sensorCode);
    List<Sensor> findByMachineId(Long machineId);
    List<Sensor> findByStatus(String status);
}
