package com.predictive.maintenance.controller;

import com.predictive.maintenance.dto.AnomalyPredictionResponseDTO;
import com.predictive.maintenance.dto.FailurePredictionResponseDTO;
import com.predictive.maintenance.entity.Prediction;
import com.predictive.maintenance.repository.PredictionRepository;
import com.predictive.maintenance.service.AnomalyDetectionService;
import com.predictive.maintenance.service.MlClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/predictions")
@RequiredArgsConstructor
public class PredictionController {

    private final AnomalyDetectionService anomalyDetectionService;
    private final MlClientService mlClientService;
    private final PredictionRepository predictionRepository;

    @PostMapping("/evaluate")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<AnomalyPredictionResponseDTO> evaluateMachineAnomaly(@RequestParam Long machineId) {
        AnomalyPredictionResponseDTO prediction = anomalyDetectionService.evaluateMachineTelemetry(machineId);
        return ResponseEntity.ok(prediction);
    }

    @PostMapping("/failure/evaluate")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<FailurePredictionResponseDTO> evaluateMachineFailure(@RequestParam Long machineId) {
        AnomalyPredictionResponseDTO anomalyRes = anomalyDetectionService.evaluateMachineTelemetry(machineId);
        FailurePredictionResponseDTO failureRes = mlClientService.getFailurePrediction(anomalyRes.getMachineId(), new ArrayList<>());
        return ResponseEntity.ok(failureRes);
    }

    @GetMapping("/machine/{machineId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER', 'OPERATOR')")
    public ResponseEntity<List<Prediction>> getPredictionsForMachine(@PathVariable Long machineId) {
        List<Prediction> predictions = predictionRepository.findByMachineId(
                machineId, PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "predictionTime"))
        ).getContent();
        return ResponseEntity.ok(predictions);
    }
}
