package com.predictive.maintenance.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SensorReadingRequestDTO {

    @NotNull(message = "Sensor ID is mandatory")
    private Long sensorId;

    private LocalDateTime timestamp;

    @NotNull(message = "Reading value is mandatory")
    private Double value;
}
