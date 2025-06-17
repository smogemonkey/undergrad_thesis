package com.vulnview.controller;

import com.vulnview.dto.notification.NotificationDto;
import com.vulnview.dto.notification.NotificationPreferenceDto;
import com.vulnview.entity.Notification;
import com.vulnview.entity.NotificationPreference;
import com.vulnview.entity.RiskLevel;
import com.vulnview.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping("/project/{projectId}")
    public ResponseEntity<Page<NotificationDto>> getUnreadNotifications(
            @PathVariable Long projectId,
            Pageable pageable) {
        log.info("Getting unread notifications for project {}", projectId);
        Page<Notification> notifications = notificationService.getUnreadNotifications(projectId, pageable);
        Page<NotificationDto> dtos = notifications.map(this::convertToDto);
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/project/{projectId}/high-severity")
    public ResponseEntity<List<NotificationDto>> getUnreadHighSeverityNotifications(
            @PathVariable Long projectId) {
        log.info("Getting unread high severity notifications for project {}", projectId);
        List<Notification> notifications = notificationService.getUnreadHighSeverityNotifications(projectId);
        List<NotificationDto> dtos = notifications.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/{notificationId}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long notificationId) {
        log.info("Marking notification {} as read", notificationId);
        notificationService.markAsRead(notificationId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/project/{projectId}/read-all")
    public ResponseEntity<Void> markAllAsRead(@PathVariable Long projectId) {
        log.info("Marking all notifications as read for project {}", projectId);
        notificationService.markAllAsRead(projectId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/project/{projectId}/unread-count")
    public ResponseEntity<Long> getUnreadCount(@PathVariable Long projectId) {
        log.info("Getting unread notification count for project {}", projectId);
        long count = notificationService.getUnreadCount(projectId);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/project/{projectId}/high-severity-count")
    public ResponseEntity<Long> getUnreadHighSeverityCount(@PathVariable Long projectId) {
        log.info("Getting unread high severity notification count for project {}", projectId);
        long count = notificationService.getUnreadHighSeverityCount(projectId);
        return ResponseEntity.ok(count);
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long notificationId) {
        Long userId = getCurrentUserId();
        log.info("Received request to delete notification {} for user {}", notificationId, userId);
        notificationService.deleteNotification(notificationId, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/preferences")
    public ResponseEntity<NotificationPreferenceDto> getNotificationPreferences() {
        Long userId = getCurrentUserId();
        log.info("Received request to get notification preferences for user {}", userId);
        NotificationPreference preferences = notificationService.getNotificationPreferences(userId);
        return ResponseEntity.ok(toPreferenceDto(preferences));
    }

    @PutMapping("/preferences")
    public ResponseEntity<NotificationPreferenceDto> updateNotificationPreferences(
            @RequestBody NotificationPreferenceDto preferencesDto) {
        Long userId = getCurrentUserId();
        log.info("Received request to update notification preferences for user {}", userId);
        NotificationPreference preferences = toEntity(preferencesDto);
        NotificationPreference updatedPreferences = notificationService.updateNotificationPreferences(userId, preferences);
        return ResponseEntity.ok(toPreferenceDto(updatedPreferences));
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        return Long.parseLong(authentication.getName());
    }

    private NotificationDto convertToDto(Notification notification) {
        return NotificationDto.builder()
                .id(notification.getId())
                .severity(notification.getSeverity())
                .message(notification.getMessage())
                .createdAt(notification.getCreatedAt())
                .readAt(notification.getReadAt())
                .build();
    }

    private NotificationPreferenceDto toPreferenceDto(NotificationPreference preference) {
        return NotificationPreferenceDto.builder()
            .severityThreshold(preference.getSeverityThreshold())
            .emailEnabled(preference.isEmailEnabled())
            .websocketEnabled(preference.isWebsocketEnabled())
            .build();
    }

    private NotificationPreference toEntity(NotificationPreferenceDto dto) {
        NotificationPreference preference = new NotificationPreference();
        preference.setSeverityThreshold(dto.getSeverityThreshold());
        preference.setEmailEnabled(dto.isEmailEnabled());
        preference.setWebsocketEnabled(dto.isWebsocketEnabled());
        return preference;
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<String> handleRuntimeException(RuntimeException e) {
        log.error("Error processing notification request: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body("Error processing request: " + e.getMessage());
    }
} 
 