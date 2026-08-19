package com.predictive.maintenance.service;

import com.predictive.maintenance.dto.AdminUserManagementDTO;
import com.predictive.maintenance.dto.AuditLogDTO;
import com.predictive.maintenance.entity.AuditLog;
import com.predictive.maintenance.entity.Role;
import com.predictive.maintenance.entity.User;
import com.predictive.maintenance.repository.AuditLogRepository;
import com.predictive.maintenance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminService.class);

    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;

    @Transactional(readOnly = true)
    public List<AdminUserManagementDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapUserToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public AdminUserManagementDTO setUserStatus(Long userId, Boolean enabled, String adminUsername) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        String oldStatus = user.getStatus();
        String newStatus = Boolean.TRUE.equals(enabled) ? "ACTIVE" : "INACTIVE";
        user.setStatus(newStatus);
        User updated = userRepository.save(user);

        String action = Boolean.TRUE.equals(enabled) ? "USER_ACTIVATED" : "USER_DEACTIVATED";
        String details = String.format("Admin '%s' changed status of user '%s' from %s to %s",
                adminUsername, user.getUsername(), oldStatus, newStatus);

        logAuditAction(adminUsername, action, "User: " + user.getUsername(), details, "127.0.0.1");
        log.info("Admin [{}] updated user [{}] status to {}", adminUsername, user.getUsername(), newStatus);

        return mapUserToDTO(updated);
    }

    @Transactional
    public AdminUserManagementDTO setUserRole(Long userId, String newRole, String adminUsername) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        Role oldRole = user.getRole();
        Role parsedRole = Role.valueOf(newRole.toUpperCase());
        user.setRole(parsedRole);
        User updated = userRepository.save(user);

        String details = String.format("Admin '%s' changed role of user '%s' from %s to %s",
                adminUsername, user.getUsername(), oldRole.name(), parsedRole.name());

        logAuditAction(adminUsername, "ROLE_CHANGED", "User: " + user.getUsername(), details, "127.0.0.1");
        log.info("Admin [{}] updated user [{}] role from [{}] to [{}]", adminUsername, user.getUsername(), oldRole, parsedRole);

        return mapUserToDTO(updated);
    }

    @Transactional
    public void logAuditAction(String adminUsername, String action, String targetEntity, String details, String ipAddress) {
        AuditLog auditLog = AuditLog.builder()
                .adminUsername(adminUsername != null ? adminUsername : "system.admin")
                .action(action)
                .targetEntity(targetEntity)
                .details(details)
                .ipAddress(ipAddress != null ? ipAddress : "127.0.0.1")
                .timestamp(LocalDateTime.now())
                .build();

        auditLogRepository.save(auditLog);
    }

    @Transactional(readOnly = true)
    public List<AuditLogDTO> getAuditLogs(String action, String search) {
        List<AuditLog> logs;
        if (action != null && !action.isBlank()) {
            logs = auditLogRepository.findByActionOrderByTimestampDesc(action);
        } else {
            logs = auditLogRepository.findAllByOrderByTimestampDesc();
        }

        return logs.stream()
                .filter(l -> {
                    if (search == null || search.isBlank()) return true;
                    String q = search.toLowerCase();
                    return (l.getAdminUsername() != null && l.getAdminUsername().toLowerCase().contains(q)) ||
                            (l.getTargetEntity() != null && l.getTargetEntity().toLowerCase().contains(q)) ||
                            (l.getDetails() != null && l.getDetails().toLowerCase().contains(q));
                })
                .map(this::mapAuditToDTO)
                .collect(Collectors.toList());
    }

    private AdminUserManagementDTO mapUserToDTO(User user) {
        return AdminUserManagementDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole() != null ? user.getRole().name() : "OPERATOR")
                .enabled("ACTIVE".equalsIgnoreCase(user.getStatus()))
                .createdAt(user.getCreatedAt())
                .build();
    }

    private AuditLogDTO mapAuditToDTO(AuditLog log) {
        return AuditLogDTO.builder()
                .id(log.getId())
                .adminUsername(log.getAdminUsername())
                .action(log.getAction())
                .targetEntity(log.getTargetEntity())
                .details(log.getDetails())
                .ipAddress(log.getIpAddress())
                .timestamp(log.getTimestamp())
                .build();
    }
}
