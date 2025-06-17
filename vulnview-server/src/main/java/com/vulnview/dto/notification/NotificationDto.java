package com.vulnview.dto.notification;

import com.vulnview.entity.RiskLevel;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDto {
    private Long id;
    private RiskLevel severity;
    private String message;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
} 
 