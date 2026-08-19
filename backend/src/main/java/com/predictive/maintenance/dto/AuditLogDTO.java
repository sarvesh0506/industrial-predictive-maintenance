package com.predictive.maintenance.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogDTO {
    private Long id;
    private String adminUsername;
    private String action;
    private String targetEntity;
    private String details;
    private String ipAddress;
    private LocalDateTime timestamp;
}
