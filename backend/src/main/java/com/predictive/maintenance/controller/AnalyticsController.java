package com.predictive.maintenance.controller;

import com.predictive.maintenance.dto.AnalyticsSummaryDTO;
import com.predictive.maintenance.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER', 'OPERATOR')")
    public ResponseEntity<AnalyticsSummaryDTO> getAnalyticsDashboard(
            @RequestParam(defaultValue = "7d") String range,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        AnalyticsSummaryDTO summary = analyticsService.calculateAnalytics(range, startDate, endDate);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/export/csv")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER', 'OPERATOR')")
    public ResponseEntity<String> exportAnalyticsCsv(
            @RequestParam(defaultValue = "7d") String range,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        String csvContent = analyticsService.generateCsvReport(range, startDate, endDate);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", "industrial_analytics_kpi_report.csv");

        return ResponseEntity.ok()
                .headers(headers)
                .body(csvContent);
    }
}
