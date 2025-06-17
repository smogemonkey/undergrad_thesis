package com.vulnview.entity;

public enum RiskLevel {
    CRITICAL,
    HIGH,
    MEDIUM,
    LOW,
    NONE,
    UNKNOWN;

    public static RiskLevel fromString(String severity) {
        if (severity == null) return UNKNOWN;
        switch (severity.toUpperCase()) {
            case "CRITICAL": return CRITICAL;
            case "HIGH": return HIGH;
            case "MEDIUM": return MEDIUM;
            case "LOW": return LOW;
            case "NONE": return NONE;
            default: return UNKNOWN;
        }
    }
} 