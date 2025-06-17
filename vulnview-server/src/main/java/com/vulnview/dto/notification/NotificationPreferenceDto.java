package com.vulnview.dto.notification;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPreferenceDto {
    private String severityThreshold;
    private boolean emailEnabled;
    private boolean websocketEnabled;
} 
 