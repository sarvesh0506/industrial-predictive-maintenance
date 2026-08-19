package com.predictive.maintenance.controller;

import com.predictive.maintenance.dto.MachineDetailResponseDTO;
import com.predictive.maintenance.dto.MachineRequestDTO;
import com.predictive.maintenance.dto.MachineResponseDTO;
import com.predictive.maintenance.service.MachineService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/machines")
@RequiredArgsConstructor
public class MachineController {

    private final MachineService machineService;

    @GetMapping
    public ResponseEntity<Page<MachineResponseDTO>> getMachines(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String criticality,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<MachineResponseDTO> result = machineService.searchAndFilterMachines(search, status, criticality, pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MachineResponseDTO> getMachineById(@PathVariable Long id) {
        return ResponseEntity.ok(machineService.getMachineById(id));
    }

    @GetMapping("/{id}/detail")
    public ResponseEntity<MachineDetailResponseDTO> getMachineDetail(@PathVariable Long id) {
        return ResponseEntity.ok(machineService.getMachineDetail(id));
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
