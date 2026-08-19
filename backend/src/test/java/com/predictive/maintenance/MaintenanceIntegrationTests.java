package com.predictive.maintenance;

import com.predictive.maintenance.dto.MaintenanceDashboardSummaryDTO;
import com.predictive.maintenance.dto.MaintenanceTaskDTO;
import com.predictive.maintenance.entity.Machine;
import com.predictive.maintenance.repository.MachineRepository;
import com.predictive.maintenance.service.MaintenanceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class MaintenanceIntegrationTests {

    @Autowired
    private MaintenanceService maintenanceService;

    @Autowired
    private MachineRepository machineRepository;

    private Machine testMachine;

    @BeforeEach
    void setUp() {
        testMachine = machineRepository.save(Machine.builder()
                .machineCode("MCH-MAINT-TEST-01")
                .machineName("Maintenance Test CNC Milling")
                .machineType("CNC")
                .status("RUNNING")
                .criticality("CRITICAL")
                .build());
    }

    @Test
    void testCreateAndUpdateMaintenanceTask() {
        MaintenanceTaskDTO dto = MaintenanceTaskDTO.builder()
                .machineId(testMachine.getId())
                .taskTitle("Bearing Lubrication & Inspection")
                .maintenanceType("PREVENTIVE")
                .priority("HIGH")
                .dueDate(LocalDateTime.now().plusDays(3))
                .notes("Check vibration levels after grease injection.")
                .build();

        MaintenanceTaskDTO created = maintenanceService.createTask(dto);
        assertNotNull(created.getId());
        assertEquals("OPEN", created.getStatus());
        assertEquals("HIGH", created.getPriority());

        // Assign Engineer
        created.setAssignedEngineer("eng.sarvesh");
        MaintenanceTaskDTO assigned = maintenanceService.updateTask(created.getId(), created);
        assertEquals("ASSIGNED", assigned.getStatus());
        assertEquals("eng.sarvesh", assigned.getAssignedEngineer());

        // Update status to IN_PROGRESS
        assigned.setStatus("IN_PROGRESS");
        MaintenanceTaskDTO inProgress = maintenanceService.updateTask(assigned.getId(), assigned);
        assertEquals("IN_PROGRESS", inProgress.getStatus());

        // Complete Task
        MaintenanceTaskDTO completed = maintenanceService.completeTask(created.getId(), "Inspection finished cleanly.", new BigDecimal("150.00"));
        assertEquals("COMPLETED", completed.getStatus());
        assertNotNull(completed.getCompletedAt());
        assertEquals(new BigDecimal("150.00"), completed.getCost());
    }

    @Test
    void testDashboardSummaryMetrics() {
        // Create an overdue task
        MaintenanceTaskDTO overdueTask = MaintenanceTaskDTO.builder()
                .machineId(testMachine.getId())
                .taskTitle("Overdue Spindle Check")
                .priority("CRITICAL")
                .dueDate(LocalDateTime.now().minusDays(2))
                .build();
        maintenanceService.createTask(overdueTask);

        MaintenanceDashboardSummaryDTO summary = maintenanceService.getDashboardSummary();
        assertNotNull(summary);
        assertTrue(summary.getOverdueCount() >= 1);
        assertTrue(summary.getUpcomingCount() >= 1);
        assertTrue(summary.getCriticalCount() >= 1);
    }

    @Test
    void testAutomatedAiRecommendationTrigger() {
        maintenanceService.triggerAiRecommendation(testMachine, "Vibration trend spike detected (22.5 mm/s)", "CRITICAL");

        var tasks = maintenanceService.getAllTasks(null, null, testMachine.getId());
        assertFalse(tasks.isEmpty());
        MaintenanceTaskDTO recTask = tasks.get(0);
        assertTrue(recTask.getAiRecommended());
        assertEquals("CRITICAL", recTask.getPriority());
        assertTrue(recTask.getTaskTitle().contains("AI Preventive Inspection Recommended"));

        // Trigger duplicate recommendation
        maintenanceService.triggerAiRecommendation(testMachine, "Duplicate anomaly spike", "CRITICAL");
        var tasksAfter = maintenanceService.getAllTasks(null, null, testMachine.getId());
        assertEquals(tasks.size(), tasksAfter.size()); // Duplicate skipped
    }
}
