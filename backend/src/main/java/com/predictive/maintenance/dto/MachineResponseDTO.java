package com.predictive.maintenance.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MachineResponseDTO {
    private Long id;
    private String machineCode;
    private String machineName;
    private String machineType;
    private String location;
    private String manufacturer;
    private String model;
    private LocalDate installationDate;
    private String status;
    private String criticality;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
