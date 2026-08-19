package com.predictive.maintenance;

import com.predictive.maintenance.dto.AnalyticsSummaryDTO;
import com.predictive.maintenance.service.AnalyticsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AnalyticsIntegrationTests {

    @Autowired
    private AnalyticsService analyticsService;

    @Test
    void testCalculateAnalyticsDashboard() {
        AnalyticsSummaryDTO summary = analyticsService.calculateAnalytics("7d", null, null);

        assertNotNull(summary);
        assertEquals("7D", summary.getTimeframeLabel());
        assertTrue(summary.getUptimePercentage() >= 0.0 && summary.getUptimePercentage() <= 100.0);
        assertTrue(summary.getDowntimeHours() >= 0.0);
        assertTrue(summary.getMtbfHours() > 0.0);
        assertTrue(summary.getMttrHours() >= 0.0);
        assertFalse(summary.getHealthTrend().isEmpty());
        assertFalse(summary.getRiskDistribution().isEmpty());
    }

    @Test
    void testExportAnalyticsCsv() {
        String csv = analyticsService.generateCsvReport("7d", null, null);

        assertNotNull(csv);
        assertTrue(csv.contains("INDUSTRIAL PREDICTIVE MAINTENANCE PLATFORM"));
        assertTrue(csv.contains("FLEET OVERVIEW KEY PERFORMANCE INDICATORS"));
        assertTrue(csv.contains("Fleet Uptime"));
    }
}
