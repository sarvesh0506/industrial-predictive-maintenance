package com.predictive.maintenance.service;

import com.predictive.maintenance.dto.SensorReadingResponseDTO;
import com.predictive.maintenance.dto.SensorRequestDTO;
import com.predictive.maintenance.dto.SensorResponseDTO;
import com.predictive.maintenance.entity.Machine;
import com.predictive.maintenance.entity.Sensor;
import com.predictive.maintenance.entity.SensorReading;
import com.predictive.maintenance.exception.DuplicateResourceException;
import com.predictive.maintenance.exception.ResourceNotFoundException;
import com.predictive.maintenance.repository.MachineRepository;
import com.predictive.maintenance.repository.SensorReadingRepository;
import com.predictive.maintenance.repository.SensorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SensorService {

    private final SensorRepository sensorRepository;
    private final MachineRepository machineRepository;
    private final SensorReadingRepository sensorReadingRepository;

    @Transactional(readOnly = true)
    public Page<SensorResponseDTO> searchAndFilterSensors(String search, String sensorType, String status, Long machineId, Pageable pageable) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cleanType = (sensorType != null && !sensorType.trim().isEmpty() && !"ALL".equalsIgnoreCase(sensorType)) ? sensorType.trim() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) ? status.trim() : null;

        return sensorRepository.findWithFilters(cleanSearch, cleanType, cleanStatus, machineId, pageable)
                .map(this::mapToResponseDTO);
    }

    @Transactional(readOnly = true)
    public List<SensorResponseDTO> getAllSensors() {
        return sensorRepository.findAll().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SensorResponseDTO getSensorById(Long id) {
        Sensor sensor = sensorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sensor not found with ID: " + id));
        return mapToResponseDTO(sensor);
    }

    @Transactional(readOnly = true)
    public List<SensorResponseDTO> getSensorsByMachineId(Long machineId) {
        if (!machineRepository.existsById(machineId)) {
            throw new ResourceNotFoundException("Machine not found with ID: " + machineId);
        }
        return sensorRepository.findByMachineId(machineId).stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<SensorReadingResponseDTO> getSensorHistory(Long id, Pageable pageable) {
        if (!sensorRepository.existsById(id)) {
            throw new ResourceNotFoundException("Sensor not found with ID: " + id);
        }
        return sensorReadingRepository.findBySensorId(id, pageable)
                .map(reading -> SensorReadingResponseDTO.builder()
                        .id(reading.getId())
                        .sensorId(reading.getSensor().getId())
                        .sensorCode(reading.getSensor().getSensorCode())
                        .sensorType(reading.getSensor().getSensorType())
                        .unit(reading.getSensor().getUnit())
                        .timestamp(reading.getTimestamp())
                        .value(reading.getValue())
                        .build());
    }

    public SensorResponseDTO createSensor(SensorRequestDTO request) {
        if (sensorRepository.existsBySensorCode(request.getSensorCode())) {
            throw new DuplicateResourceException("Sensor with code '" + request.getSensorCode() + "' already exists");
        }

        Machine machine = machineRepository.findById(request.getMachineId())
                .orElseThrow(() -> new ResourceNotFoundException("Machine not found with ID: " + request.getMachineId()));

        Sensor sensor = Sensor.builder()
                .sensorCode(request.getSensorCode().trim().toUpperCase())
                .sensorType(request.getSensorType().trim().toUpperCase())
                .machine(machine)
                .unit(request.getUnit().trim())
                .status(request.getStatus().trim().toUpperCase())
                .build();

        Sensor savedSensor = sensorRepository.save(sensor);
        return mapToResponseDTO(savedSensor);
    }

    public SensorResponseDTO updateSensor(Long id, SensorRequestDTO request) {
        Sensor existing = sensorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sensor not found with ID: " + id));

        if (!existing.getSensorCode().equalsIgnoreCase(request.getSensorCode()) &&
            sensorRepository.existsBySensorCode(request.getSensorCode())) {
            throw new DuplicateResourceException("Sensor code '" + request.getSensorCode() + "' is already in use");
        }

        Machine machine = machineRepository.findById(request.getMachineId())
                .orElseThrow(() -> new ResourceNotFoundException("Machine not found with ID: " + request.getMachineId()));

        existing.setSensorCode(request.getSensorCode().trim().toUpperCase());
        existing.setSensorType(request.getSensorType().trim().toUpperCase());
        existing.setMachine(machine);
        existing.setUnit(request.getUnit().trim());
        existing.setStatus(request.getStatus().trim().toUpperCase());

        Sensor updatedSensor = sensorRepository.save(existing);
        return mapToResponseDTO(updatedSensor);
    }

    public void deleteSensor(Long id) {
        if (!sensorRepository.existsById(id)) {
            throw new ResourceNotFoundException("Sensor not found with ID: " + id);
        }
        sensorRepository.deleteById(id);
    }

    private SensorResponseDTO mapToResponseDTO(Sensor sensor) {
        return SensorResponseDTO.builder()
                .id(sensor.getId())
                .sensorCode(sensor.getSensorCode())
                .sensorType(sensor.getSensorType())
                .machineId(sensor.getMachine().getId())
                .machineCode(sensor.getMachine().getMachineCode())
                .machineName(sensor.getMachine().getMachineName())
                .unit(sensor.getUnit())
                .status(sensor.getStatus())
                .createdAt(sensor.getCreatedAt())
                .updatedAt(sensor.getUpdatedAt())
                .build();
    }
}
