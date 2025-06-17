package com.vulnview.service;

import lombok.Builder;
import lombok.Data;
import java.util.function.Consumer;
import java.util.Map;

@Data
@Builder
public class ComponentToEnrich {
    private String name;
    private String version;
    private String type;
    private String groupName;
    private Consumer<Map<String, Object>> callback;
} 