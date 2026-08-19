package com.predictive.maintenance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MachineRequestDTO {

    @NotBlank(message = "Machine code is mandatory")
    @Size(max = 50, message = "Machine code must not exceed 50 characters")
    private String machineCode;

    @NotBlank(message = "Machine name is mandatory")
    @Size(max = 100, message = "Machine name must not exceed 100 characters")
    private String machineName;

    @NotBlank(message = "Machine type is mandatory")
    @Size(max = 50, message = "Machine type must not exceed 50 characters")
    private String machineType;

    private String location;
    private String manufacturer;
    private String model;
    private LocalDate installationDate;

    @NotBlank(message = "Status is mandatory")
    private String status;

    @NotBlank(message = "Criticality level is mandatory")
    private String criticality;
}
