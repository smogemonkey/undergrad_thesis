package com.vulnview.dto;

import com.vulnview.entity.RiskLevel;
import lombok.*;

import java.util.Map;
import java.util.function.Consumer;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComponentToEnrich {
    private Long id;
    private String name;
    private String version;
    private String type;
    private String groupName;
    private String purl;
    private RiskLevel riskLevel;
    private Consumer<Map<String, Object>> callback;
    private Long sbomId;
    private String vendor;

    public String getPackageUrl() {
        return purl;
    }

    public void setPackageUrl(String purl) {
        this.purl = purl;
    }
} 