package com.predictive.maintenance;

import com.predictive.maintenance.dto.MachineRequestDTO;
import com.predictive.maintenance.dto.MachineResponseDTO;
import com.predictive.maintenance.dto.SensorRequestDTO;
import com.predictive.maintenance.dto.SensorResponseDTO;
import com.predictive.maintenance.service.MachineService;
import com.predictive.maintenance.service.SensorReadingService;
import com.predictive.maintenance.service.SensorService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class PredictiveMaintenanceApplicationTests {

    @Autowired
    private MachineService machineService;

    @Autowired
    private SensorService sensorService;

    @Autowired
    private SensorReadingService sensorReadingService;

    @Test
    void contextLoads() {
        assertThat(machineService).isNotNull();
        assertThat(sensorService).isNotNull();
        assertThat(sensorReadingService).isNotNull();
    }

    @Test
    void testMachineAndSensorLifecycle() {
        // 1. Create Machine
        MachineRequestDTO machineRequest = MachineRequestDTO.builder()
                .machineCode("TST-MILL-01")
                .machineName("Test CNC Milling Machine")
                .machineType("Milling")
                .location("Test Lab")
                .manufacturer("TestCorp")
                .model("V1")
                .installationDate(LocalDate.now())
                .status("OPERATIONAL")
                .criticality("HIGH")
                .build();

        MachineResponseDTO machine = machineService.createMachine(machineRequest);
        assertThat(machine.getId()).isNotNull();
        assertThat(machine.getMachineCode()).isEqualTo("TST-MILL-01");

        // 2. Create Sensor for Machine
        SensorRequestDTO sensorRequest = SensorRequestDTO.builder()
                .sensorCode("TST-VIB-01")
                .sensorType("VIBRATION")
                .machineId(machine.getId())
                .unit("mm/s")
                .status("ACTIVE")
                .build();

        SensorResponseDTO sensor = sensorService.createSensor(sensorRequest);
        assertThat(sensor.getId()).isNotNull();
        assertThat(sensor.getSensorCode()).isEqualTo("TST-VIB-01");
        assertThat(sensor.getMachineId()).isEqualTo(machine.getId());
    }
}
