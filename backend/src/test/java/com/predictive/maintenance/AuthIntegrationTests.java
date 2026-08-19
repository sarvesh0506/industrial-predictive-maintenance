package com.predictive.maintenance;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.predictive.maintenance.dto.LoginRequestDTO;
import com.predictive.maintenance.dto.MachineRequestDTO;
import com.predictive.maintenance.dto.RegisterRequestDTO;
import com.predictive.maintenance.entity.Role;
import com.predictive.maintenance.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Test
    void testSuccessfulRegistrationAndLogin() throws Exception {
        RegisterRequestDTO register = RegisterRequestDTO.builder()
                .username("testengineer")
                .email("engineer@factory.com")
                .password("securePassword123")
                .fullName("Lead Engineer")
                .role(Role.ENGINEER)
                .build();

        // 1. Register User
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.username").value("testengineer"))
                .andExpect(jsonPath("$.role").value("ENGINEER"));

        // 2. Login User
        LoginRequestDTO login = LoginRequestDTO.builder()
                .usernameOrEmail("testengineer")
                .password("securePassword123")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.username").value("testengineer"));
    }

    @Test
    void testIncorrectPasswordReturns401() throws Exception {
        RegisterRequestDTO register = RegisterRequestDTO.builder()
                .username("operator_user")
                .email("operator@factory.com")
                .password("correctPassword")
                .role(Role.OPERATOR)
                .build();

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(register)));

        LoginRequestDTO invalidLogin = LoginRequestDTO.builder()
                .usernameOrEmail("operator_user")
                .password("wrongPassword")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidLogin)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    void testProtectedEndpointWithoutTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testInvalidJwtTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer invalid.jwt.token.string"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testUnauthorizedRoleAccessReturns403() throws Exception {
        // Register OPERATOR user
        RegisterRequestDTO register = RegisterRequestDTO.builder()
                .username("operator_john")
                .email("john@factory.com")
                .password("operatorPass")
                .role(Role.OPERATOR)
                .build();

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(register)));

        String operatorToken = jwtTokenProvider.generateTokenFromUsername("operator_john", Role.OPERATOR.name());

        MachineRequestDTO createMachine = MachineRequestDTO.builder()
                .machineCode("CNC-OP-01")
                .machineName("Operator Created Lathe")
                .machineType("Lathe")
                .status("OPERATIONAL")
                .criticality("LOW")
                .build();

        // OPERATOR trying to create a machine should be forbidden (403)
        mockMvc.perform(post("/api/machines")
                        .header("Authorization", "Bearer " + operatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createMachine)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    void testAuthorizedEngineerAccessSucceeds() throws Exception {
        // Register ENGINEER user
        RegisterRequestDTO register = RegisterRequestDTO.builder()
                .username("engineer_sarah")
                .email("sarah@factory.com")
                .password("engineerPass")
                .role(Role.ENGINEER)
                .build();

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(register)));

        String engineerToken = jwtTokenProvider.generateTokenFromUsername("engineer_sarah", Role.ENGINEER.name());

        MachineRequestDTO createMachine = MachineRequestDTO.builder()
                .machineCode("CNC-ENG-01")
                .machineName("Engineer Milling Machine")
                .machineType("Milling")
                .location("Bay C")
                .installationDate(LocalDate.now())
                .status("OPERATIONAL")
                .criticality("CRITICAL")
                .build();

        // ENGINEER creating machine should succeed (201)
        mockMvc.perform(post("/api/machines")
                        .header("Authorization", "Bearer " + engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createMachine)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.machineCode").value("CNC-ENG-01"));
    }
}
