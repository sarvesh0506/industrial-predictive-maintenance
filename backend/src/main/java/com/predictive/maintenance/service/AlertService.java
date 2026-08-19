package com.predictive.maintenance.service;

import com.predictive.maintenance.dto.AlertDTO;
import com.predictive.maintenance.dto.SensorThresholdConfigDTO;
import com.predictive.maintenance.entity.Alert;
import com.predictive.maintenance.entity.Machine;
import com.predictive.maintenance.entity.Sensor;
import com.predictive.maintenance.entity.SensorThresholdConfig;
import com.predictive.maintenance.repository.AlertRepository;
import com.predictive.maintenance.repository.MachineRepository;
import com.predictive.maintenance.repository.SensorRepository;
import com.predictive.maintenance.repository.SensorThresholdConfigRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlertService {

    private static final Logger log = LoggerFactory.getLogger(AlertService.class);

    private final AlertRepository alertRepository;
    private final MachineRepository machineRepository;
    private final SensorRepository sensorRepository;
    private final SensorThresholdConfigRepository thresholdConfigRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @PostConstruct
    public void initDefaultThresholdConfigs() {
        if (thresholdConfigRepository.count() == 0) {
            log.info("Initializing default Sensor Threshold Configurations...");
            List<SensorThresholdConfig> defaults = List.of(
                    SensorThresholdConfig.builder().sensorType("TEMPERATURE").warningMax(75.0).criticalMax(90.0).unit("°C").build(),
                    SensorThresholdConfig.builder().sensorType("VIBRATION").warningMax(4.0).criticalMax(10.0).unit("mm/s").build(),
                    SensorThresholdConfig.builder().sensorType("PRESSURE").warningMin(2.0).warningMax(8.0).criticalMin(1.0).criticalMax(10.0).unit("bar").build(),
                    SensorThresholdConfig.builder().sensorType("RPM").warningMin(2000.0).warningMax(3500.0).criticalMin(1000.0).criticalMax(4000.0).unit("RPM").build(),
                    SensorThresholdConfig.builder().sensorType("CURRENT").warningMax(20.0).criticalMax(30.0).unit("A").build(),
                    SensorThresholdConfig.builder().sensorType("VOLTAGE").warningMin(380.0).warningMax(420.0).criticalMin(350.0).criticalMax(450.0).unit("V").build()
            );
            thresholdConfigRepository.saveAll(defaults);
        }
    }

    @Transactional
    public AlertDTO createAlert(AlertDTO dto) {
        Machine machine = machineRepository.findById(dto.getMachineId())
                .orElseThrow(() -> new IllegalArgumentException("Machine not found with ID: " + dto.getMachineId()));

        Sensor sensor = null;
        if (dto.getSensorId() != null) {
            sensor = sensorRepository.findById(dto.getSensorId()).orElse(null);
        }

        String source = dto.getAlertSource() != null ? dto.getAlertSource() : "SENSOR_THRESHOLD";

        // Prevent Duplicate Active Alerts for the same condition on the same machine
        List<Alert> existingActive = alertRepository.findActiveAlertByMachineAndSource(machine.getId(), source);
        if (!existingActive.isEmpty()) {
            log.info("Skipped duplicate alert creation for machine [{}], source [{}]. Active alert already exists.",
                    machine.getMachineCode(), source);
            return mapToDTO(existingActive.get(0));
        }

        Alert alert = Alert.builder()
                .machine(machine)
                .sensor(sensor)
                .alertSource(source)
                .severity(dto.getSeverity() != null ? dto.getSeverity() : "WARNING")
                .alertMessage(dto.getAlertMessage())
                .status("ACTIVE")
                .isAcknowledged(false)
                .triggeredAt(LocalDateTime.now())
                .build();

        Alert saved = alertRepository.save(alert);
        AlertDTO savedDTO = mapToDTO(saved);

        // Update Machine Status if CRITICAL
        if ("CRITICAL".equalsIgnoreCase(saved.getSeverity())) {
            if ("RUNNING".equalsIgnoreCase(machine.getStatus()) || "IDLE".equalsIgnoreCase(machine.getStatus())) {
                machine.setStatus("CRITICAL");
                machineRepository.save(machine);
            }
        }

        // STOMP WebSocket Real-Time Alert Broadcast over /topic/alerts
        try {
            messagingTemplate.convertAndSend("/topic/alerts", savedDTO);
            log.info("Broadcasted alert over WebSocket destination /topic/alerts: [{}]", saved.getAlertMessage());
        } catch (Exception e) {
            log.warn("Failed to broadcast WebSocket alert over /topic/alerts: {}", e.getMessage());
        }

        return savedDTO;
    }

    @Transactional
    public AlertDTO acknowledgeAlert(Long id, String username) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Alert not found with ID: " + id));

        alert.setIsAcknowledged(true);
        alert.setStatus("ACKNOWLEDGED");
        alert.setAcknowledgedBy(username != null ? username : "system.user");
        alert.setAcknowledgedAt(LocalDateTime.now());

        Alert updated = alertRepository.save(alert);
        AlertDTO updatedDTO = mapToDTO(updated);

        try {
            messagingTemplate.convertAndSend("/topic/alerts", updatedDTO);
        } catch (Exception e) {
            log.warn("Failed to broadcast alert acknowledgment: {}", e.getMessage());
        }

        return updatedDTO;
    }

    @Transactional
    public AlertDTO resolveAlert(Long id, String username) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Alert not found with ID: " + id));

        alert.setStatus("RESOLVED");
        alert.setResolvedBy(username != null ? username : "system.user");
        alert.setResolvedAt(LocalDateTime.now());

        Alert updated = alertRepository.save(alert);
        AlertDTO updatedDTO = mapToDTO(updated);

        try {
            messagingTemplate.convertAndSend("/topic/alerts", updatedDTO);
        } catch (Exception e) {
            log.warn("Failed to broadcast alert resolution: {}", e.getMessage());
        }

        return updatedDTO;
    }

    @Transactional(readOnly = true)
    public List<AlertDTO> getAlerts(String severity, String source, String status, Long machineId, String search) {
        List<Alert> alerts;
        if (machineId != null) {
            alerts = alertRepository.findByMachineIdOrderByTriggeredAtDesc(machineId);
        } else if (severity != null && !severity.isBlank()) {
            alerts = alertRepository.findBySeverity(severity);
        } else if (source != null && !source.isBlank()) {
            alerts = alertRepository.findByAlertSource(source);
        } else if (status != null && !status.isBlank()) {
            alerts = alertRepository.findByStatus(status);
        } else {
            alerts = alertRepository.findAll();
        }

        return alerts.stream()
                .filter(a -> {
                    if (search == null || search.isBlank()) return true;
                    String q = search.toLowerCase();
                    return (a.getAlertMessage() != null && a.getAlertMessage().toLowerCase().contains(q)) ||
                            (a.getMachine() != null && a.getMachine().getMachineCode().toLowerCase().contains(q));
                })
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AlertDTO getAlertById(Long id) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Alert not found with ID: " + id));
        return mapToDTO(alert);
    }

    @Transactional
    public void evaluateSensorReadingThresholds(Machine machine, Sensor sensor, double value) {
        if (sensor == null || sensor.getSensorType() == null) return;

        Optional<SensorThresholdConfig> configOpt = thresholdConfigRepository.findBySensorType(sensor.getSensorType().toUpperCase());
        if (configOpt.isEmpty()) return;

        SensorThresholdConfig config = configOpt.get();

        String severity = null;
        String message = null;

        if (config.getCriticalMax() != null && value >= config.getCriticalMax()) {
            severity = "CRITICAL";
            message = String.format("Critical High %s on %s: %.2f %s (Threshold: %.2f %s)",
                    sensor.getSensorType(), machine.getMachineCode(), value, sensor.getUnit(), config.getCriticalMax(), sensor.getUnit());
        } else if (config.getCriticalMin() != null && value <= config.getCriticalMin()) {
            severity = "CRITICAL";
            message = String.format("Critical Low %s on %s: %.2f %s (Threshold: %.2f %s)",
                    sensor.getSensorType(), machine.getMachineCode(), value, sensor.getUnit(), config.getCriticalMin(), sensor.getUnit());
        } else if (config.getWarningMax() != null && value >= config.getWarningMax()) {
            severity = "WARNING";
            message = String.format("Warning High %s on %s: %.2f %s (Threshold: %.2f %s)",
                    sensor.getSensorType(), machine.getMachineCode(), value, sensor.getUnit(), config.getWarningMax(), sensor.getUnit());
        } else if (config.getWarningMin() != null && value <= config.getWarningMin()) {
            severity = "WARNING";
            message = String.format("Warning Low %s on %s: %.2f %s (Threshold: %.2f %s)",
                    sensor.getSensorType(), machine.getMachineCode(), value, sensor.getUnit(), config.getWarningMin(), sensor.getUnit());
        }

        if (severity != null && message != null) {
            AlertDTO dto = AlertDTO.builder()
                    .machineId(machine.getId())
                    .sensorId(sensor.getId())
                    .alertSource("SENSOR_THRESHOLD")
                    .severity(severity)
                    .alertMessage(message)
                    .build();
            createAlert(dto);
        }
    }

    @Transactional(readOnly = true)
    public List<SensorThresholdConfigDTO> getThresholdConfigs() {
        return thresholdConfigRepository.findAll().stream()
                .map(this::mapThresholdToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public SensorThresholdConfigDTO updateThresholdConfig(SensorThresholdConfigDTO dto) {
        SensorThresholdConfig config = thresholdConfigRepository.findBySensorType(dto.getSensorType().toUpperCase())
                .orElse(SensorThresholdConfig.builder().sensorType(dto.getSensorType().toUpperCase()).build());

        config.setWarningMin(dto.getWarningMin());
        config.setWarningMax(dto.getWarningMax());
        config.setCriticalMin(dto.getCriticalMin());
        config.setCriticalMax(dto.getCriticalMax());
        if (dto.getUnit() != null) config.setUnit(dto.getUnit());

        SensorThresholdConfig saved = thresholdConfigRepository.save(config);
        log.info("Updated Threshold Config for Sensor Type [{}]", saved.getSensorType());
        return mapThresholdToDTO(saved);
    }

    private AlertDTO mapToDTO(Alert alert) {
        return AlertDTO.builder()
                .id(alert.getId())
                .machineId(alert.getMachine().getId())
                .machineCode(alert.getMachine().getMachineCode())
                .machineName(alert.getMachine().getMachineName())
                .sensorId(alert.getSensor() != null ? alert.getSensor().getId() : null)
                .sensorCode(alert.getSensor() != null ? alert.getSensor().getSensorCode() : null)
                .alertSource(alert.getAlertSource())
                .severity(alert.getSeverity())
                .alertMessage(alert.getAlertMessage())
                .status(alert.getStatus())
                .isAcknowledged(alert.getIsAcknowledged())
                .acknowledgedBy(alert.getAcknowledgedBy())
                .acknowledgedAt(alert.getAcknowledgedAt())
                .resolvedBy(alert.getResolvedBy())
                .resolvedAt(alert.getResolvedAt())
                .triggeredAt(alert.getTriggeredAt())
                .build();
    }

    private SensorThresholdConfigDTO mapThresholdToDTO(SensorThresholdConfig config) {
        return SensorThresholdConfigDTO.builder()
                .id(config.getId())
                .sensorType(config.getSensorType())
                .warningMin(config.getWarningMin())
                .warningMax(config.getWarningMax())
                .criticalMin(config.getCriticalMin())
                .criticalMax(config.getCriticalMax())
                .unit(config.getUnit())
                .build();
    }
}
