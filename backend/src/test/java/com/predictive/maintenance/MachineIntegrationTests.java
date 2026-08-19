package com.predictive.maintenance;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.predictive.maintenance.dto.MachineRequestDTO;
import com.predictive.maintenance.entity.Role;
import com.predictive.maintenance.entity.User;
import com.predictive.maintenance.repository.UserRepository;
import com.predictive.maintenance.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
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
class MachineIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        if (!userRepository.existsByUsername("engineer_user")) {
            userRepository.save(User.builder()
                    .username("engineer_user")
                    .email("eng@factory.com")
                    .passwordHash(passwordEncoder.encode("password"))
                    .role(Role.ENGINEER)
                    .status("ACTIVE")
                    .build());
        }

        if (!userRepository.existsByUsername("operator_user")) {
            userRepository.save(User.builder()
                    .username("operator_user")
                    .email("op@factory.com")
                    .passwordHash(passwordEncoder.encode("password"))
                    .role(Role.OPERATOR)
                    .status("ACTIVE")
                    .build());
        }
    }

    private String getEngineerToken() {
        return "Bearer " + jwtTokenProvider.generateTokenFromUsername("engineer_user", Role.ENGINEER.name());
    }

    private String getOperatorToken() {
        return "Bearer " + jwtTokenProvider.generateTokenFromUsername("operator_user", Role.OPERATOR.name());
    }

    @Test
    void testCreateAndGetMachine() throws Exception {
        MachineRequestDTO request = MachineRequestDTO.builder()
                .machineCode("MCH-MILL-101")
                .machineName("5-Axis Milling Center")
                .machineType("Milling")
                .location("Bay A - Zone 1")
                .manufacturer("Haas")
                .model("VF-4SS")
                .installationDate(LocalDate.now())
                .status("RUNNING")
                .criticality("HIGH")
                .build();

        String responseJson = mockMvc.perform(post("/api/machines")
                        .header("Authorization", getEngineerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.machineCode").value("MCH-MILL-101"))
                .andExpect(jsonPath("$.status").value("RUNNING"))
                .andReturn().getResponse().getContentAsString();

        Long id = objectMapper.readTree(responseJson).get("id").asLong();

        // Get by ID
        mockMvc.perform(get("/api/machines/" + id)
                        .header("Authorization", getOperatorToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.machineName").value("5-Axis Milling Center"));
    }

    @Test
    void testSearchAndFilterMachines() throws Exception {
        MachineRequestDTO machine1 = MachineRequestDTO.builder()
                .machineCode("MCH-PMP-100")
                .machineName("Hydraulic Pump Alpha")
                .machineType("Pump")
                .status("RUNNING")
                .criticality("MEDIUM")
                .build();

        MachineRequestDTO machine2 = MachineRequestDTO.builder()
                .machineCode("MCH-CMP-200")
                .machineName("Air Compressor Beta")
                .machineType("Compressor")
                .status("CRITICAL")
                .criticality("CRITICAL")
                .build();

        mockMvc.perform(post("/api/machines").header("Authorization", getEngineerToken()).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(machine1))).andExpect(status().isCreated());
        mockMvc.perform(post("/api/machines").header("Authorization", getEngineerToken()).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(machine2))).andExpect(status().isCreated());

        // Search test
        mockMvc.perform(get("/api/machines?search=Compressor")
                        .header("Authorization", getOperatorToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].machineCode").value("MCH-CMP-200"));

        // Status Filter test
        mockMvc.perform(get("/api/machines?status=CRITICAL")
                        .header("Authorization", getOperatorToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].status").value("CRITICAL"));

        // Criticality Filter test
        mockMvc.perform(get("/api/machines?criticality=CRITICAL")
                        .header("Authorization", getOperatorToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].criticality").value("CRITICAL"));
    }

    @Test
    void testUpdateAndMachineDetail() throws Exception {
        MachineRequestDTO request = MachineRequestDTO.builder()
                .machineCode("MCH-LATHE-300")
                .machineName("Precision CNC Lathe")
                .machineType("Lathe")
                .status("IDLE")
                .criticality("LOW")
                .build();

        String responseJson = mockMvc.perform(post("/api/machines")
                        .header("Authorization", getEngineerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long id = objectMapper.readTree(responseJson).get("id").asLong();

        // Update status to MAINTENANCE
        request.setStatus("MAINTENANCE");
        request.setCriticality("HIGH");

        mockMvc.perform(put("/api/machines/" + id)
                        .header("Authorization", getEngineerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("MAINTENANCE"))
                .andExpect(jsonPath("$.criticality").value("HIGH"));

        // Get Machine Detail Payload
        mockMvc.perform(get("/api/machines/" + id + "/detail")
                        .header("Authorization", getOperatorToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.healthScore").exists())
                .andExpect(jsonPath("$.sensors").isArray());
    }
}
