package com.predictive.maintenance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SensorRequestDTO {

    @NotBlank(message = "Sensor code is mandatory")
    @Size(max = 50, message = "Sensor code must not exceed 50 characters")
    private String sensorCode;

    @NotBlank(message = "Sensor type is mandatory")
    @Pattern(regexp = "(?i)^(TEMPERATURE|VIBRATION|PRESSURE|RPM|CURRENT|VOLTAGE)$", 
             message = "Sensor type must be one of: TEMPERATURE, VIBRATION, PRESSURE, RPM, CURRENT, VOLTAGE")
    private String sensorType;

    @NotNull(message = "Machine ID is mandatory")
    private Long machineId;

    @NotBlank(message = "Unit is mandatory")
    @Size(max = 20, message = "Unit must not exceed 20 characters")
    private String unit;

    @NotBlank(message = "Status is mandatory")
    @Pattern(regexp = "(?i)^(ACTIVE|INACTIVE|FAULTY|CALIBRATING)$", 
             message = "Status must be one of: ACTIVE, INACTIVE, FAULTY, CALIBRATING")
    private String status;
}
