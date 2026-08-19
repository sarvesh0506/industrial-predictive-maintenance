package com.predictive.maintenance.repository;

import com.predictive.maintenance.entity.Machine;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MachineRepository extends JpaRepository<Machine, Long> {
    Optional<Machine> findByMachineCode(String machineCode);
    boolean existsByMachineCode(String machineCode);

    @Query("SELECT m FROM Machine m WHERE " +
           "(:search IS NULL OR LOWER(m.machineCode) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(m.machineName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(m.location) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:status IS NULL OR LOWER(m.status) = LOWER(:status)) AND " +
           "(:criticality IS NULL OR LOWER(m.criticality) = LOWER(:criticality))")
    Page<Machine> findWithFilters(
            @Param("search") String search,
            @Param("status") String status,
            @Param("criticality") String criticality,
            Pageable pageable
    );
}
