package com.predictive.maintenance.controller;

import com.predictive.maintenance.dto.SensorReadingRequestDTO;
import com.predictive.maintenance.dto.SensorReadingResponseDTO;
import com.predictive.maintenance.service.SensorReadingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sensor-readings")
@RequiredArgsConstructor
public class SensorReadingController {

    private final SensorReadingService sensorReadingService;

    @GetMapping
    public ResponseEntity<Page<SensorReadingResponseDTO>> getAllReadings(
            @PageableDefault(size = 50, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(sensorReadingService.getAllReadings(pageable));
    }

    @GetMapping("/{sensorId}")
    public ResponseEntity<Page<SensorReadingResponseDTO>> getReadingsBySensorId(
            @PathVariable Long sensorId,
            @PageableDefault(size = 50, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(sensorReadingService.getReadingsBySensorId(sensorId, pageable));
    }

    @PostMapping
    public ResponseEntity<SensorReadingResponseDTO> recordReading(@Valid @RequestBody SensorReadingRequestDTO request) {
        SensorReadingResponseDTO recorded = sensorReadingService.recordReading(request);
        return new ResponseEntity<>(recorded, HttpStatus.CREATED);
    }
}
