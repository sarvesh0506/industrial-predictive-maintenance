package com.predictive.maintenance.repository;

import com.predictive.maintenance.entity.Sensor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SensorRepository extends JpaRepository<Sensor, Long> {
    Optional<Sensor> findBySensorCode(String sensorCode);
    boolean existsBySensorCode(String sensorCode);
    List<Sensor> findByMachineId(Long machineId);
    List<Sensor> findByStatus(String status);

    @Query("SELECT s FROM Sensor s WHERE " +
           "(:search IS NULL OR LOWER(s.sensorCode) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(s.sensorType) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(s.unit) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:sensorType IS NULL OR LOWER(s.sensorType) = LOWER(:sensorType)) AND " +
           "(:status IS NULL OR LOWER(s.status) = LOWER(:status)) AND " +
           "(:machineId IS NULL OR s.machine.id = :machineId)")
    Page<Sensor> findWithFilters(
            @Param("search") String search,
            @Param("sensorType") String sensorType,
            @Param("status") String status,
            @Param("machineId") Long machineId,
            Pageable pageable
    );
}
