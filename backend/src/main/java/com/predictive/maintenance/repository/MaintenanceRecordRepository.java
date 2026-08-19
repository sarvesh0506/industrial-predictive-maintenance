package com.predictive.maintenance.repository;

import com.predictive.maintenance.entity.MaintenanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MaintenanceRecordRepository extends JpaRepository<MaintenanceRecord, Long> {
    List<MaintenanceRecord> findByMachineId(Long machineId);

    List<MaintenanceRecord> findByMachineIdOrderByCreatedAtDesc(Long machineId);

    List<MaintenanceRecord> findByStatus(String status);

    List<MaintenanceRecord> findByPriority(String priority);

    long countByStatus(String status);

    long countByPriorityAndStatusNotIn(String priority, List<String> statuses);

    @Query("SELECT COUNT(m) FROM MaintenanceRecord m WHERE m.dueDate < :now AND m.status NOT IN ('COMPLETED', 'CANCELLED')")
    long countOverdueTasks(@Param("now") LocalDateTime now);

    @Query("SELECT m FROM MaintenanceRecord m WHERE m.machine.id = :machineId AND m.aiRecommended = true AND m.status NOT IN ('COMPLETED', 'CANCELLED')")
    List<MaintenanceRecord> findActiveAiRecommendations(@Param("machineId") Long machineId);
}
