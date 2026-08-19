package com.predictive.maintenance.service;

import com.predictive.maintenance.dto.MachineRequestDTO;
import com.predictive.maintenance.dto.MachineResponseDTO;
import com.predictive.maintenance.entity.Machine;
import com.predictive.maintenance.exception.DuplicateResourceException;
import com.predictive.maintenance.exception.ResourceNotFoundException;
import com.predictive.maintenance.repository.MachineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class MachineService {

    private final MachineRepository machineRepository;

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
