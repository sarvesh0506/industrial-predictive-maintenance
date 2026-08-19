package com.predictive.maintenance.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequestDTO {

    @NotBlank(message = "Username or email is mandatory")
    private String usernameOrEmail;

    @NotBlank(message = "Password is mandatory")
    private String password;
}
