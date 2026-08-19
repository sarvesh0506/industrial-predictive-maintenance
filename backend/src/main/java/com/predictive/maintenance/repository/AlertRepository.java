package com.predictive.maintenance.repository;

import com.predictive.maintenance.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByMachineId(Long machineId);
    List<Alert> findByIsAcknowledgedFalse();
}
