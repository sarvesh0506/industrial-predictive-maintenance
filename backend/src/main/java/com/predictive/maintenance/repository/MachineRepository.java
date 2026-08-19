package com.predictive.maintenance.repository;

import com.predictive.maintenance.entity.Machine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MachineRepository extends JpaRepository<Machine, Long> {
    Optional<Machine> findByMachineCode(String machineCode);
    boolean existsByMachineCode(String machineCode);
    List<Machine> findByStatus(String status);
    List<Machine> findByCriticality(String criticality);
}
