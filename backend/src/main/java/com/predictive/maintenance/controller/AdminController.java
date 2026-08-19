package com.predictive.maintenance.controller;

import com.predictive.maintenance.dto.AdminUserManagementDTO;
import com.predictive.maintenance.dto.AuditLogDTO;
import com.predictive.maintenance.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserManagementDTO>> getAllUsers() {
        List<AdminUserManagementDTO> users = adminService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<AdminUserManagementDTO> setUserStatus(
            @PathVariable Long id,
            @RequestParam Boolean enabled,
            Authentication auth) {
        String adminUsername = auth != null ? auth.getName() : "admin";
        AdminUserManagementDTO updated = adminService.setUserStatus(id, enabled, adminUsername);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<AdminUserManagementDTO> setUserRole(
            @PathVariable Long id,
            @RequestParam String role,
            Authentication auth) {
        String adminUsername = auth != null ? auth.getName() : "admin";
        AdminUserManagementDTO updated = adminService.setUserRole(id, role, adminUsername);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLogDTO>> getAuditLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String search) {
        List<AuditLogDTO> logs = adminService.getAuditLogs(action, search);
        return ResponseEntity.ok(logs);
    }
}
