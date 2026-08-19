package com.predictive.maintenance.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImportantFeatureDTO {
    private String feature;
    private Double score;
}
