package com.predictive.maintenance.repository;

import com.predictive.maintenance.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByMachineId(Long machineId);

    List<Alert> findByMachineIdOrderByTriggeredAtDesc(Long machineId);

    List<Alert> findByIsAcknowledgedFalse();

    List<Alert> findByMachineIdAndIsAcknowledgedFalse(Long machineId);

    List<Alert> findBySeverity(String severity);

    List<Alert> findByAlertSource(String alertSource);

    List<Alert> findByStatus(String status);

    @Query("SELECT a FROM Alert a WHERE a.machine.id = :machineId AND a.alertSource = :alertSource AND a.status NOT IN ('RESOLVED')")
    List<Alert> findActiveAlertByMachineAndSource(@Param("machineId") Long machineId, @Param("alertSource") String alertSource);
}
