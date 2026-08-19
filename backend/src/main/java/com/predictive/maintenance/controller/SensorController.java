package com.predictive.maintenance.controller;

import com.predictive.maintenance.dto.SensorReadingResponseDTO;
import com.predictive.maintenance.dto.SensorRequestDTO;
import com.predictive.maintenance.dto.SensorResponseDTO;
import com.predictive.maintenance.service.SensorService;
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
@RequestMapping("/api/sensors")
@RequiredArgsConstructor
public class SensorController {

    private final SensorService sensorService;

    @GetMapping
    public ResponseEntity<Page<SensorResponseDTO>> getSensors(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sensorType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long machineId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<SensorResponseDTO> result = sensorService.searchAndFilterSensors(search, sensorType, status, machineId, pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SensorResponseDTO> getSensorById(@PathVariable Long id) {
        return ResponseEntity.ok(sensorService.getSensorById(id));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<Page<SensorReadingResponseDTO>> getSensorHistory(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        return ResponseEntity.ok(sensorService.getSensorHistory(id, pageable));
    }

    @PostMapping
    public ResponseEntity<SensorResponseDTO> createSensor(@Valid @RequestBody SensorRequestDTO request) {
        SensorResponseDTO created = sensorService.createSensor(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SensorResponseDTO> updateSensor(@PathVariable Long id, @Valid @RequestBody SensorRequestDTO request) {
        return ResponseEntity.ok(sensorService.updateSensor(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSensor(@PathVariable Long id) {
        sensorService.deleteSensor(id);
        return ResponseEntity.noContent().build();
    }
}
