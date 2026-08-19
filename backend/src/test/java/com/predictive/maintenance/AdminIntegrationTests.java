package com.predictive.maintenance;

import com.predictive.maintenance.dto.AdminUserManagementDTO;
import com.predictive.maintenance.dto.AuditLogDTO;
import com.predictive.maintenance.entity.Role;
import com.predictive.maintenance.entity.User;
import com.predictive.maintenance.repository.UserRepository;
import com.predictive.maintenance.service.AdminService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AdminIntegrationTests {

    @Autowired
    private AdminService adminService;

    @Autowired
    private UserRepository userRepository;

    private User testOperator;

    @BeforeEach
    void setUp() {
        testOperator = userRepository.save(User.builder()
                .username("op.sarvesh")
                .email("op.sarvesh@industrial.com")
                .passwordHash("hashed_password")
                .fullName("Sarvesh Operator")
                .role(Role.OPERATOR)
                .status("ACTIVE")
                .build());
    }

    @Test
    void testAdminUserStatusAndRoleManagement() {
        // Deactivate User
        AdminUserManagementDTO deactivated = adminService.setUserStatus(testOperator.getId(), false, "admin.sarvesh");
        assertFalse(deactivated.getEnabled());

        // Assign ENGINEER Role
        AdminUserManagementDTO roleUpdated = adminService.setUserRole(testOperator.getId(), "ENGINEER", "admin.sarvesh");
        assertEquals("ENGINEER", roleUpdated.getRole());

        // Verify Audit Logs Recorded
        List<AuditLogDTO> auditLogs = adminService.getAuditLogs(null, "op.sarvesh");
        assertFalse(auditLogs.isEmpty());
        assertTrue(auditLogs.stream().anyMatch(l -> "USER_DEACTIVATED".equals(l.getAction())));
        assertTrue(auditLogs.stream().anyMatch(l -> "ROLE_CHANGED".equals(l.getAction())));
    }

    @Test
    void testAuditLogRecordingAndRetrieval() {
        adminService.logAuditAction("admin.sarvesh", "MACHINE_CONFIGURED", "Machine: MCH-CNC-001", "Updated criticality to CRITICAL", "192.168.1.50");

        List<AuditLogDTO> logs = adminService.getAuditLogs("MACHINE_CONFIGURED", null);
        assertFalse(logs.isEmpty());
        AuditLogDTO entry = logs.get(0);
        assertEquals("admin.sarvesh", entry.getAdminUsername());
        assertEquals("MACHINE_CONFIGURED", entry.getAction());
        assertEquals("Machine: MCH-CNC-001", entry.getTargetEntity());
    }
}
