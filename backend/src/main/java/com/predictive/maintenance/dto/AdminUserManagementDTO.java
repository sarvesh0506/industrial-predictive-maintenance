package com.predictive.maintenance.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUserManagementDTO {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String role; // ADMIN, ENGINEER, OPERATOR
    private Boolean enabled;
    private LocalDateTime createdAt;
}
