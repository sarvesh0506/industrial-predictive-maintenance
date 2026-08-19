package com.predictive.maintenance.repository;

import com.predictive.maintenance.entity.Prediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PredictionRepository extends JpaRepository<Prediction, Long> {
    List<Prediction> findByMachineIdOrderByPredictionTimeDesc(Long machineId);
}
