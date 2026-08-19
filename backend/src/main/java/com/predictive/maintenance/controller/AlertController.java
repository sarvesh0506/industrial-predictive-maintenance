package com.predictive.maintenance.controller;

import com.predictive.maintenance.dto.AlertDTO;
import com.predictive.maintenance.dto.SensorThresholdConfigDTO;
import com.predictive.maintenance.service.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER', 'OPERATOR')")
    public ResponseEntity<List<AlertDTO>> getAlerts(
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String source,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long machineId,
            @RequestParam(required = false) String search) {
        List<AlertDTO> alerts = alertService.getAlerts(severity, source, status, machineId, search);
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER', 'OPERATOR')")
    public ResponseEntity<AlertDTO> getAlertById(@PathVariable Long id) {
        AlertDTO alert = alertService.getAlertById(id);
        return ResponseEntity.ok(alert);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<AlertDTO> createAlert(@RequestBody AlertDTO dto) {
        AlertDTO created = alertService.createAlert(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}/acknowledge")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER', 'OPERATOR')")
    public ResponseEntity<AlertDTO> acknowledgeAlert(@PathVariable Long id, Authentication auth) {
        String username = auth != null ? auth.getName() : "operator.user";
        AlertDTO acked = alertService.acknowledgeAlert(id, username);
        return ResponseEntity.ok(acked);
    }

    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<AlertDTO> resolveAlert(@PathVariable Long id, Authentication auth) {
        String username = auth != null ? auth.getName() : "engineer.user";
        AlertDTO resolved = alertService.resolveAlert(id, username);
        return ResponseEntity.ok(resolved);
    }

    @GetMapping("/threshold-configs")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER', 'OPERATOR')")
    public ResponseEntity<List<SensorThresholdConfigDTO>> getThresholdConfigs() {
        List<SensorThresholdConfigDTO> configs = alertService.getThresholdConfigs();
        return ResponseEntity.ok(configs);
    }

    @PutMapping("/threshold-configs")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<SensorThresholdConfigDTO> updateThresholdConfig(@RequestBody SensorThresholdConfigDTO dto) {
        SensorThresholdConfigDTO updated = alertService.updateThresholdConfig(dto);
        return ResponseEntity.ok(updated);
    }
}
