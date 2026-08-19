package com.predictive.maintenance.repository;

import com.predictive.maintenance.entity.MaintenanceSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenanceScheduleRepository extends JpaRepository<MaintenanceSchedule, Long> {
    List<MaintenanceSchedule> findByMachineId(Long machineId);
    List<MaintenanceSchedule> findByStatus(String status);
}
