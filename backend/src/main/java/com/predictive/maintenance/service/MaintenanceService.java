package com.predictive.maintenance.service;

import com.predictive.maintenance.dto.MaintenanceDashboardSummaryDTO;
import com.predictive.maintenance.dto.MaintenanceTaskDTO;
import com.predictive.maintenance.entity.Machine;
import com.predictive.maintenance.entity.MaintenanceRecord;
import com.predictive.maintenance.repository.MachineRepository;
import com.predictive.maintenance.repository.MaintenanceRecordRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MaintenanceService {

    private static final Logger log = LoggerFactory.getLogger(MaintenanceService.class);
    private final MaintenanceRecordRepository maintenanceRecordRepository;
    private final MachineRepository machineRepository;

    @Transactional
    public MaintenanceTaskDTO createTask(MaintenanceTaskDTO dto) {
        Machine machine = machineRepository.findById(dto.getMachineId())
                .orElseThrow(() -> new IllegalArgumentException("Machine not found with ID: " + dto.getMachineId()));

        MaintenanceRecord record = MaintenanceRecord.builder()
                .machine(machine)
                .taskTitle(dto.getTaskTitle() != null ? dto.getTaskTitle() : "Routine Maintenance Inspection")
                .maintenanceType(dto.getMaintenanceType() != null ? dto.getMaintenanceType() : "PREVENTIVE")
                .description(dto.getDescription())
                .status(dto.getStatus() != null ? dto.getStatus() : (dto.getAssignedEngineer() != null ? "ASSIGNED" : "OPEN"))
                .priority(dto.getPriority() != null ? dto.getPriority() : "MEDIUM")
                .assignedEngineer(dto.getAssignedEngineer())
                .dueDate(dto.getDueDate() != null ? dto.getDueDate() : LocalDateTime.now().plusDays(7))
                .cost(dto.getCost() != null ? dto.getCost() : BigDecimal.ZERO)
                .notes(dto.getNotes())
                .aiRecommended(dto.getAiRecommended() != null ? dto.getAiRecommended() : false)
                .recommendationReason(dto.getRecommendationReason())
                .servicedAt(LocalDateTime.now())
                .build();

        MaintenanceRecord saved = maintenanceRecordRepository.save(record);
        log.info("Created Maintenance Task [ID: {}] for Machine [{}]", saved.getId(), machine.getMachineCode());
        return mapToDTO(saved);
    }

    @Transactional
    public MaintenanceTaskDTO updateTask(Long id, MaintenanceTaskDTO dto) {
        MaintenanceRecord record = maintenanceRecordRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Maintenance task not found with ID: " + id));

        if (dto.getTaskTitle() != null) record.setTaskTitle(dto.getTaskTitle());
        if (dto.getMaintenanceType() != null) record.setMaintenanceType(dto.getMaintenanceType());
        if (dto.getDescription() != null) record.setDescription(dto.getDescription());
        if (dto.getPriority() != null) record.setPriority(dto.getPriority());
        if (dto.getDueDate() != null) record.setDueDate(dto.getDueDate());
        if (dto.getNotes() != null) record.setNotes(dto.getNotes());
        if (dto.getCost() != null) record.setCost(dto.getCost());

        if (dto.getStatus() != null && !dto.getStatus().equals(record.getStatus())) {
            record.setStatus(dto.getStatus());
            if ("COMPLETED".equals(dto.getStatus()) && record.getCompletedAt() == null) {
                record.setCompletedAt(LocalDateTime.now());
            }
        }

        if (dto.getAssignedEngineer() != null) {
            record.setAssignedEngineer(dto.getAssignedEngineer());
            if ("OPEN".equals(record.getStatus()) && !dto.getAssignedEngineer().isBlank()) {
                record.setStatus("ASSIGNED");
            }
        }

        MaintenanceRecord updated = maintenanceRecordRepository.save(record);
        log.info("Updated Maintenance Task [ID: {}] Status to [{}]", updated.getId(), updated.getStatus());
        return mapToDTO(updated);
    }

    @Transactional
    public MaintenanceTaskDTO completeTask(Long id, String notes, BigDecimal cost) {
        MaintenanceRecord record = maintenanceRecordRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Maintenance task not found with ID: " + id));

        record.setStatus("COMPLETED");
        record.setCompletedAt(LocalDateTime.now());
        if (notes != null && !notes.isBlank()) {
            record.setNotes((record.getNotes() != null ? record.getNotes() + "\n" : "") + "Completion Note: " + notes);
        }
        if (cost != null) {
            record.setCost(cost);
        }

        MaintenanceRecord completed = maintenanceRecordRepository.save(record);
        log.info("Completed Maintenance Task [ID: {}]", completed.getId());
        return mapToDTO(completed);
    }

    @Transactional(readOnly = true)
    public MaintenanceDashboardSummaryDTO getDashboardSummary() {
        long overdue = maintenanceRecordRepository.countOverdueTasks(LocalDateTime.now());
        long openCount = maintenanceRecordRepository.countByStatus("OPEN");
        long assignedCount = maintenanceRecordRepository.countByStatus("ASSIGNED");
        long inProgressCount = maintenanceRecordRepository.countByStatus("IN_PROGRESS");
        long completed = maintenanceRecordRepository.countByStatus("COMPLETED");
        long critical = maintenanceRecordRepository.countByPriorityAndStatusNotIn(
                "CRITICAL", Arrays.asList("COMPLETED", "CANCELLED")
        );

        long upcoming = openCount + assignedCount + inProgressCount;

        return MaintenanceDashboardSummaryDTO.builder()
                .overdueCount(overdue)
                .upcomingCount(upcoming)
                .completedCount(completed)
                .criticalCount(critical)
                .build();
    }

    @Transactional(readOnly = true)
    public List<MaintenanceTaskDTO> getAllTasks(String status, String priority, Long machineId) {
        List<MaintenanceRecord> records;
        if (machineId != null) {
            records = maintenanceRecordRepository.findByMachineIdOrderByCreatedAtDesc(machineId);
        } else if (status != null && !status.isBlank()) {
            records = maintenanceRecordRepository.findByStatus(status);
        } else if (priority != null && !priority.isBlank()) {
            records = maintenanceRecordRepository.findByPriority(priority);
        } else {
            records = maintenanceRecordRepository.findAll();
        }

        return records.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MaintenanceTaskDTO getTaskById(Long id) {
        MaintenanceRecord record = maintenanceRecordRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Maintenance task not found with ID: " + id));
        return mapToDTO(record);
    }

    @Transactional
    public void triggerAiRecommendation(Machine machine, String reason, String priority) {
        List<MaintenanceRecord> activeRecs = maintenanceRecordRepository.findActiveAiRecommendations(machine.getId());
        if (!activeRecs.isEmpty()) {
            log.debug("Active AI maintenance recommendation task already exists for machine [{}]. Skipping duplicate.", machine.getMachineCode());
            return;
        }

        MaintenanceRecord record = MaintenanceRecord.builder()
                .machine(machine)
                .taskTitle("AI Preventive Inspection Recommended: " + machine.getMachineCode())
                .maintenanceType("AI_RECOMMENDED")
                .description("Automated predictive maintenance recommendation based on telemetry analysis. Reason: " + reason)
                .status("OPEN")
                .priority(priority != null ? priority : "HIGH")
                .dueDate(LocalDateTime.now().plusDays(2))
                .aiRecommended(true)
                .recommendationReason(reason)
                .servicedAt(LocalDateTime.now())
                .build();

        maintenanceRecordRepository.save(record);
        log.info("Triggered AI Maintenance Recommendation Task for Machine [{}]", machine.getMachineCode());
    }

    private MaintenanceTaskDTO mapToDTO(MaintenanceRecord record) {
        return MaintenanceTaskDTO.builder()
                .id(record.getId())
                .machineId(record.getMachine().getId())
                .machineCode(record.getMachine().getMachineCode())
                .machineName(record.getMachine().getMachineName())
                .taskTitle(record.getTaskTitle())
                .maintenanceType(record.getMaintenanceType())
                .description(record.getDescription())
                .status(record.getStatus())
                .priority(record.getPriority())
                .assignedEngineer(record.getAssignedEngineer())
                .dueDate(record.getDueDate())
                .servicedAt(record.getServicedAt())
                .completedAt(record.getCompletedAt())
                .cost(record.getCost())
                .notes(record.getNotes())
                .aiRecommended(record.getAiRecommended())
                .recommendationReason(record.getRecommendationReason())
                .createdAt(record.getCreatedAt())
                .build();
    }
}
