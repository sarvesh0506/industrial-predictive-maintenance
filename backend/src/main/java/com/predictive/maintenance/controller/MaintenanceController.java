package com.predictive.maintenance.controller;

import com.predictive.maintenance.dto.MaintenanceDashboardSummaryDTO;
import com.predictive.maintenance.dto.MaintenanceTaskDTO;
import com.predictive.maintenance.service.MaintenanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/maintenance")
@RequiredArgsConstructor
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER', 'OPERATOR')")
    public ResponseEntity<List<MaintenanceTaskDTO>> getAllTasks(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) Long machineId) {
        List<MaintenanceTaskDTO> tasks = maintenanceService.getAllTasks(status, priority, machineId);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER', 'OPERATOR')")
    public ResponseEntity<MaintenanceTaskDTO> getTaskById(@PathVariable Long id) {
        MaintenanceTaskDTO task = maintenanceService.getTaskById(id);
        return ResponseEntity.ok(task);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<MaintenanceTaskDTO> createTask(@RequestBody MaintenanceTaskDTO dto) {
        MaintenanceTaskDTO created = maintenanceService.createTask(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<MaintenanceTaskDTO> updateTask(@PathVariable Long id, @RequestBody MaintenanceTaskDTO dto) {
        MaintenanceTaskDTO updated = maintenanceService.updateTask(id, dto);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<MaintenanceTaskDTO> completeTask(
            @PathVariable Long id,
            @RequestParam(required = false) String notes,
            @RequestParam(required = false) BigDecimal cost) {
        MaintenanceTaskDTO completed = maintenanceService.completeTask(id, notes, cost);
        return ResponseEntity.ok(completed);
    }

    @GetMapping("/dashboard/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER', 'OPERATOR')")
    public ResponseEntity<MaintenanceDashboardSummaryDTO> getDashboardSummary() {
        MaintenanceDashboardSummaryDTO summary = maintenanceService.getDashboardSummary();
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/machine/{machineId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER', 'OPERATOR')")
    public ResponseEntity<List<MaintenanceTaskDTO>> getTasksForMachine(@PathVariable Long machineId) {
        List<MaintenanceTaskDTO> tasks = maintenanceService.getAllTasks(null, null, machineId);
        return ResponseEntity.ok(tasks);
    }
}
