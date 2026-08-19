package com.predictive.maintenance.service;

import com.predictive.maintenance.dto.SensorReadingRequestDTO;
import com.predictive.maintenance.dto.SensorReadingResponseDTO;
import com.predictive.maintenance.entity.Sensor;
import com.predictive.maintenance.entity.SensorReading;
import com.predictive.maintenance.exception.ResourceNotFoundException;
import com.predictive.maintenance.repository.SensorReadingRepository;
import com.predictive.maintenance.repository.SensorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class SensorReadingService {

    private final SensorReadingRepository sensorReadingRepository;
    private final SensorRepository sensorRepository;

    @Transactional(readOnly = true)
    public Page<SensorReadingResponseDTO> getAllReadings(Pageable pageable) {
        return sensorReadingRepository.findAll(pageable)
                .map(this::mapToResponseDTO);
    }

    @Transactional(readOnly = true)
    public Page<SensorReadingResponseDTO> getReadingsBySensorId(Long sensorId, Pageable pageable) {
        if (!sensorRepository.existsById(sensorId)) {
            throw new ResourceNotFoundException("Sensor not found with ID: " + sensorId);
        }
        return sensorReadingRepository.findBySensorId(sensorId, pageable)
                .map(this::mapToResponseDTO);
    }

    public SensorReadingResponseDTO recordReading(SensorReadingRequestDTO request) {
        Sensor sensor = sensorRepository.findById(request.getSensorId())
                .orElseThrow(() -> new ResourceNotFoundException("Sensor not found with ID: " + request.getSensorId()));

        SensorReading reading = SensorReading.builder()
                .sensor(sensor)
                .timestamp(request.getTimestamp() != null ? request.getTimestamp() : LocalDateTime.now())
                .value(request.getValue())
                .build();

        SensorReading savedReading = sensorReadingRepository.save(reading);
        return mapToResponseDTO(savedReading);
    }

    private SensorReadingResponseDTO mapToResponseDTO(SensorReading reading) {
        return SensorReadingResponseDTO.builder()
                .id(reading.getId())
                .sensorId(reading.getSensor().getId())
                .sensorCode(reading.getSensor().getSensorCode())
                .sensorType(reading.getSensor().getSensorType())
                .unit(reading.getSensor().getUnit())
                .timestamp(reading.getTimestamp())
                .value(reading.getValue())
                .build();
    }
}
