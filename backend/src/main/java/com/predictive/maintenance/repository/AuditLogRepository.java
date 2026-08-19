package com.predictive.maintenance.repository;

import com.predictive.maintenance.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findAllByOrderByTimestampDesc();
    List<AuditLog> findByAdminUsernameOrderByTimestampDesc(String adminUsername);
    List<AuditLog> findByActionOrderByTimestampDesc(String action);
}
