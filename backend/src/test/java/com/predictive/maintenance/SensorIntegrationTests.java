package com.predictive.maintenance;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.predictive.maintenance.dto.SensorRequestDTO;
import com.predictive.maintenance.entity.Machine;
import com.predictive.maintenance.entity.Role;
import com.predictive.maintenance.entity.User;
import com.predictive.maintenance.repository.MachineRepository;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SensorIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MachineRepository machineRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Long testMachineId;

    @BeforeEach
    void setUp() {
        if (!userRepository.existsByUsername("engineer_sensor")) {
            userRepository.save(User.builder()
                    .username("engineer_sensor")
                    .email("eng_sensor@factory.com")
                    .passwordHash(passwordEncoder.encode("password"))
                    .role(Role.ENGINEER)
                    .status("ACTIVE")
                    .build());
        }

        if (!userRepository.existsByUsername("operator_sensor")) {
            userRepository.save(User.builder()
                    .username("operator_sensor")
                    .email("op_sensor@factory.com")
                    .passwordHash(passwordEncoder.encode("password"))
                    .role(Role.OPERATOR)
                    .status("ACTIVE")
                    .build());
        }

        Machine machine = machineRepository.save(Machine.builder()
                .machineCode("MCH-TEST-99")
                .machineName("Test Sensor Mounting Press")
                .machineType("Press")
                .status("RUNNING")
                .criticality("MEDIUM")
                .build());
        testMachineId = machine.getId();
    }

    private String getEngineerToken() {
        return "Bearer " + jwtTokenProvider.generateTokenFromUsername("engineer_sensor", Role.ENGINEER.name());
    }

    private String getOperatorToken() {
        return "Bearer " + jwtTokenProvider.generateTokenFromUsername("operator_sensor", Role.OPERATOR.name());
    }

    @Test
    void testCreateAndGetSensorWithValidTypes() throws Exception {
        String[] supportedTypes = {"TEMPERATURE", "VIBRATION", "PRESSURE", "RPM", "CURRENT", "VOLTAGE"};

        for (int i = 0; i < supportedTypes.length; i++) {
            String type = supportedTypes[i];
            SensorRequestDTO request = SensorRequestDTO.builder()
                    .sensorCode("SNR-" + type + "-" + (i + 1))
                    .sensorType(type)
                    .machineId(testMachineId)
                    .unit("°C")
                    .status("ACTIVE")
                    .build();

            mockMvc.perform(post("/api/sensors")
                            .header("Authorization", getEngineerToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").exists())
                    .andExpect(jsonPath("$.sensorType").value(type));
        }
    }

    @Test
    void testSensorCodeUniquenessValidation() throws Exception {
        SensorRequestDTO request = SensorRequestDTO.builder()
                .sensorCode("SNR-UNIQUE-01")
                .sensorType("VIBRATION")
                .machineId(testMachineId)
                .unit("mm/s")
                .status("ACTIVE")
                .build();

        mockMvc.perform(post("/api/sensors")
                .header("Authorization", getEngineerToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Attempt duplicate creation
        mockMvc.perform(post("/api/sensors")
                        .header("Authorization", getEngineerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Conflict"));
    }

    @Test
    void testMachineExistenceValidation() throws Exception {
        SensorRequestDTO request = SensorRequestDTO.builder()
                .sensorCode("SNR-ORPHAN-01")
                .sensorType("PRESSURE")
                .machineId(999999L)
                .unit("bar")
                .status("ACTIVE")
                .build();

        mockMvc.perform(post("/api/sensors")
                        .header("Authorization", getEngineerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Not Found"));
    }

    @Test
    void testInvalidSensorTypeValidation() throws Exception {
        SensorRequestDTO request = SensorRequestDTO.builder()
                .sensorCode("SNR-INVALID-01")
                .sensorType("INVALID_TYPE")
                .machineId(testMachineId)
                .unit("unit")
                .status("ACTIVE")
                .build();

        mockMvc.perform(post("/api/sensors")
                        .header("Authorization", getEngineerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Failed"));
    }

    @Test
    void testSearchFilterAndHistory() throws Exception {
        SensorRequestDTO request = SensorRequestDTO.builder()
                .sensorCode("SNR-RPM-55")
                .sensorType("RPM")
                .machineId(testMachineId)
                .unit("RPM")
                .status("ACTIVE")
                .build();

        String responseJson = mockMvc.perform(post("/api/sensors")
                        .header("Authorization", getEngineerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long sensorId = objectMapper.readTree(responseJson).get("id").asLong();

        // Search test
        mockMvc.perform(get("/api/sensors?search=RPM")
                        .header("Authorization", getOperatorToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].sensorCode").value("SNR-RPM-55"));

        // Get Sensor History
        mockMvc.perform(get("/api/sensors/" + sensorId + "/history")
                        .header("Authorization", getOperatorToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }
}
