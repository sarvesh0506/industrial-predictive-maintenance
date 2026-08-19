package com.predictive.maintenance.service;

import com.predictive.maintenance.dto.MachineDetailResponseDTO;
import com.predictive.maintenance.dto.MachineRequestDTO;
import com.predictive.maintenance.dto.MachineResponseDTO;
import com.predictive.maintenance.entity.Machine;
import com.predictive.maintenance.entity.Sensor;
import com.predictive.maintenance.entity.SensorReading;
import com.predictive.maintenance.exception.DuplicateResourceException;
import com.predictive.maintenance.exception.ResourceNotFoundException;
import com.predictive.maintenance.repository.AlertRepository;
import com.predictive.maintenance.repository.MachineRepository;
import com.predictive.maintenance.repository.MaintenanceRecordRepository;
import com.predictive.maintenance.repository.PredictionRepository;
import com.predictive.maintenance.repository.SensorReadingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class MachineService {

    private final MachineRepository machineRepository;
    private final SensorReadingRepository sensorReadingRepository;
    private final AlertRepository alertRepository;
    private final MaintenanceRecordRepository maintenanceRecordRepository;
    private final PredictionRepository predictionRepository;

    @Transactional(readOnly = true)
    public Page<MachineResponseDTO> searchAndFilterMachines(String search, String status, String criticality, Pageable pageable) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) ? status.trim() : null;
        String cleanCriticality = (criticality != null && !criticality.trim().isEmpty() && !"ALL".equalsIgnoreCase(criticality)) ? criticality.trim() : null;

        return machineRepository.findWithFilters(cleanSearch, cleanStatus, cleanCriticality, pageable)
                .map(this::mapToResponseDTO);
    }

    @Transactional(readOnly = true)
    public List<MachineResponseDTO> getAllMachines() {
        return machineRepository.findAll().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MachineResponseDTO getMachineById(Long id) {
        Machine machine = machineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Machine not found with ID: " + id));
        return mapToResponseDTO(machine);
    }

    @Transactional(readOnly = true)
    public MachineDetailResponseDTO getMachineDetail(Long id) {
        Machine machine = machineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Machine not found with ID: " + id));

        // Map Sensors & Latest Readings
        List<MachineDetailResponseDTO.SensorDetailItemDTO> sensorItems = new ArrayList<>();
        if (machine.getSensors() != null) {
            for (Sensor s : machine.getSensors()) {
                Page<SensorReading> latestPage = sensorReadingRepository.findBySensorId(
                        s.getId(), PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "timestamp"))
                );
                SensorReading latest = latestPage.hasContent() ? latestPage.getContent().get(0) : null;

                sensorItems.add(MachineDetailResponseDTO.SensorDetailItemDTO.builder()
                        .id(s.getId())
                        .sensorCode(s.getSensorCode())
                        .sensorType(s.getSensorType())
                        .unit(s.getUnit())
                        .status(s.getStatus())
                        .latestValue(latest != null ? latest.getValue() : null)
                        .latestTimestamp(latest != null ? latest.getTimestamp() : null)
                        .build());
            }
        }

        // Map Active Alerts
        List<MachineDetailResponseDTO.AlertItemDTO> alertItems = alertRepository.findByMachineId(id).stream()
                .filter(a -> !Boolean.TRUE.equals(a.getIsAcknowledged()))
                .map(a -> MachineDetailResponseDTO.AlertItemDTO.builder()
                        .id(a.getId())
                        .severity(a.getSeverity())
                        .alertMessage(a.getAlertMessage())
                        .isAcknowledged(a.getIsAcknowledged())
                        .triggeredAt(a.getTriggeredAt())
                        .build())
                .collect(Collectors.toList());

        // Map Maintenance History
        List<MachineDetailResponseDTO.MaintenanceRecordItemDTO> maintenanceItems = maintenanceRecordRepository.findByMachineId(id).stream()
                .map(m -> MachineDetailResponseDTO.MaintenanceRecordItemDTO.builder()
                        .id(m.getId())
                        .maintenanceType(m.getMaintenanceType())
                        .description(m.getDescription())
                        .servicedAt(m.getServicedAt())
                        .cost(m.getCost())
                        .performedByUsername(m.getPerformedBy() != null ? m.getPerformedBy().getUsername() : "System")
                        .build())
                .collect(Collectors.toList());

        // Map Predictions
        List<MachineDetailResponseDTO.PredictionItemDTO> predictionItems = predictionRepository.findByMachineIdOrderByPredictionTimeDesc(id).stream()
                .map(p -> MachineDetailResponseDTO.PredictionItemDTO.builder()
                        .id(p.getId())
                        .failureProbability(p.getFailureProbability())
                        .predictedRulHours(p.getPredictedRulHours())
                        .anomalyScore(p.getAnomalyScore())
                        .predictionTime(p.getPredictionTime())
                        .modelVersion(p.getModelVersion())
                        .build())
                .collect(Collectors.toList());

        // Dynamic Health Score Calculation
        double healthScore = 95.0;
        if ("CRITICAL".equalsIgnoreCase(machine.getStatus())) {
            healthScore = 30.0;
        } else if ("MAINTENANCE".equalsIgnoreCase(machine.getStatus())) {
            healthScore = 60.0;
        } else if ("OFFLINE".equalsIgnoreCase(machine.getStatus())) {
            healthScore = 0.0;
        }
        if (!alertItems.isEmpty()) {
            healthScore = Math.max(10.0, healthScore - (alertItems.size() * 15.0));
        }

        return MachineDetailResponseDTO.builder()
                .id(machine.getId())
                .machineCode(machine.getMachineCode())
                .machineName(machine.getMachineName())
                .machineType(machine.getMachineType())
                .location(machine.getLocation())
                .manufacturer(machine.getManufacturer())
                .model(machine.getModel())
                .installationDate(machine.getInstallationDate())
                .status(machine.getStatus())
                .criticality(machine.getCriticality())
                .createdAt(machine.getCreatedAt())
                .updatedAt(machine.getUpdatedAt())
                .healthScore(Math.round(healthScore * 10.0) / 10.0)
                .sensors(sensorItems)
                .activeAlerts(alertItems)
                .maintenanceHistory(maintenanceItems)
                .predictions(predictionItems)
                .build();
    }

    public MachineResponseDTO createMachine(MachineRequestDTO request) {
        if (machineRepository.existsByMachineCode(request.getMachineCode())) {
            throw new DuplicateResourceException("Machine with code '" + request.getMachineCode() + "' already exists");
        }

        Machine machine = Machine.builder()
                .machineCode(request.getMachineCode())
                .machineName(request.getMachineName())
                .machineType(request.getMachineType())
                .location(request.getLocation())
                .manufacturer(request.getManufacturer())
                .model(request.getModel())
                .installationDate(request.getInstallationDate())
                .status(request.getStatus())
                .criticality(request.getCriticality())
                .build();

        Machine savedMachine = machineRepository.save(machine);
        return mapToResponseDTO(savedMachine);
    }

    public MachineResponseDTO updateMachine(Long id, MachineRequestDTO request) {
        Machine existing = machineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Machine not found with ID: " + id));

        if (!existing.getMachineCode().equalsIgnoreCase(request.getMachineCode()) &&
            machineRepository.existsByMachineCode(request.getMachineCode())) {
            throw new DuplicateResourceException("Machine code '" + request.getMachineCode() + "' is already in use");
        }

        existing.setMachineCode(request.getMachineCode());
        existing.setMachineName(request.getMachineName());
        existing.setMachineType(request.getMachineType());
        existing.setLocation(request.getLocation());
        existing.setManufacturer(request.getManufacturer());
        existing.setModel(request.getModel());
        existing.setInstallationDate(request.getInstallationDate());
        existing.setStatus(request.getStatus());
        existing.setCriticality(request.getCriticality());

        Machine updatedMachine = machineRepository.save(existing);
        return mapToResponseDTO(updatedMachine);
    }

    public void deleteMachine(Long id) {
        if (!machineRepository.existsById(id)) {
            throw new ResourceNotFoundException("Machine not found with ID: " + id);
        }
        machineRepository.deleteById(id);
    }

    private MachineResponseDTO mapToResponseDTO(Machine machine) {
        return MachineResponseDTO.builder()
                .id(machine.getId())
                .machineCode(machine.getMachineCode())
                .machineName(machine.getMachineName())
                .machineType(machine.getMachineType())
                .location(machine.getLocation())
                .manufacturer(machine.getManufacturer())
                .model(machine.getModel())
                .installationDate(machine.getInstallationDate())
                .status(machine.getStatus())
                .criticality(machine.getCriticality())
                .createdAt(machine.getCreatedAt())
                .updatedAt(machine.getUpdatedAt())
                .build();
    }
}
