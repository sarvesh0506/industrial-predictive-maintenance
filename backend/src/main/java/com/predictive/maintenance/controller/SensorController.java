package com.predictive.maintenance.controller;

import com.predictive.maintenance.dto.SensorRequestDTO;
import com.predictive.maintenance.dto.SensorResponseDTO;
import com.predictive.maintenance.service.SensorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sensors")
@RequiredArgsConstructor
public class SensorController {

    private final SensorService sensorService;

    @GetMapping
    public ResponseEntity<List<SensorResponseDTO>> getAllSensors(@RequestParam(required = false) Long machineId) {
        if (machineId != null) {
            return ResponseEntity.ok(sensorService.getSensorsByMachineId(machineId));
        }
        return ResponseEntity.ok(sensorService.getAllSensors());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SensorResponseDTO> getSensorById(@PathVariable Long id) {
        return ResponseEntity.ok(sensorService.getSensorById(id));
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
}
