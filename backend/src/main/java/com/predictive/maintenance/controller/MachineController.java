package com.predictive.maintenance.controller;

import com.predictive.maintenance.dto.MachineRequestDTO;
import com.predictive.maintenance.dto.MachineResponseDTO;
import com.predictive.maintenance.service.MachineService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/machines")
@RequiredArgsConstructor
public class MachineController {

    private final MachineService machineService;

    @GetMapping
    public ResponseEntity<List<MachineResponseDTO>> getAllMachines() {
        return ResponseEntity.ok(machineService.getAllMachines());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MachineResponseDTO> getMachineById(@PathVariable Long id) {
        return ResponseEntity.ok(machineService.getMachineById(id));
    }

    @PostMapping
    public ResponseEntity<MachineResponseDTO> createMachine(@Valid @RequestBody MachineRequestDTO request) {
        MachineResponseDTO created = machineService.createMachine(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MachineResponseDTO> updateMachine(@PathVariable Long id, @Valid @RequestBody MachineRequestDTO request) {
        return ResponseEntity.ok(machineService.updateMachine(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMachine(@PathVariable Long id) {
        machineService.deleteMachine(id);
        return ResponseEntity.noContent().build();
    }
}
