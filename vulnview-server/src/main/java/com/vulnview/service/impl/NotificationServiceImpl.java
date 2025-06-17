package com.vulnview.service.impl;

import com.vulnview.entity.*;
import com.vulnview.repository.*;
import com.vulnview.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {
    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository notificationPreferenceRepository;
    private final ProjectRepository projectRepository;
    private final ComponentRepository componentRepository;
    private final VulnerabilityRepository vulnerabilityRepository;

    @Override
    @Transactional
    public Notification createVulnerabilityNotification(Long projectId, Long componentId, Long vulnerabilityId,
                                                      RiskLevel severity, Notification.NotificationType type) {
        log.info("Creating notification for project {}, component {}, vulnerability {}", 
                projectId, componentId, vulnerabilityId);

        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found"));
        Component component = componentRepository.findById(componentId)
            .orElseThrow(() -> new RuntimeException("Component not found"));
        Vulnerability vulnerability = vulnerabilityRepository.findById(vulnerabilityId)
            .orElseThrow(() -> new RuntimeException("Vulnerability not found"));

        String title = generateNotificationTitle(type, component.getName(), vulnerability.getCveId());
        String message = generateNotificationMessage(type, component.getName(), vulnerability.getCveId(), 
                vulnerability.getDescription());

        Notification notification = new Notification();
        notification.setProject(project);
        notification.setComponent(component);
        notification.setVulnerability(vulnerability);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setSeverity(severity);
        notification.setType(type);
        notification.setRead(false);

        return notificationRepository.save(notification);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Notification> getUnreadNotifications(Long projectId, Pageable pageable) {
        return notificationRepository.findByProjectIdAndIsReadFalse(projectId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Notification> getUnreadHighSeverityNotifications(Long projectId) {
        return notificationRepository.findByProjectIdAndSeverityInAndIsReadFalse(
            projectId, 
            Arrays.asList(RiskLevel.CRITICAL, RiskLevel.HIGH)
        );
    }

    @Override
    @Transactional
    public void markAsRead(Long notificationId) {
        notificationRepository.markAsRead(notificationId);
    }

    @Override
    @Transactional
    public void markAllAsRead(Long projectId) {
        notificationRepository.markAllAsRead(projectId);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(Long projectId) {
        return notificationRepository.countByProjectIdAndIsReadFalse(projectId);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadHighSeverityCount(Long projectId) {
        return notificationRepository.countByProjectIdAndSeverityInAndIsReadFalse(
            projectId,
            Arrays.asList(RiskLevel.CRITICAL, RiskLevel.HIGH)
        );
    }

    @Override
    @Transactional
    public void deleteNotification(Long projectId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new RuntimeException("Notification not found"));
        if (!notification.getProject().getId().equals(projectId)) {
            throw new RuntimeException("Notification does not belong to the specified project");
        }
        notificationRepository.delete(notification);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Notification> getProjectNotifications(Long projectId) {
        return notificationRepository.findByProjectIdAndIsReadFalse(projectId, Pageable.unpaged()).getContent();
    }

    @Override
    @Transactional
    public void markNotificationAsRead(Long projectId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new RuntimeException("Notification not found"));
        if (!notification.getProject().getId().equals(projectId)) {
            throw new RuntimeException("Notification does not belong to the specified project");
        }
        notificationRepository.markAsRead(notificationId);
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationPreference getNotificationPreferences(Long userId) {
        return notificationPreferenceRepository.findByUserId(userId)
            .orElseGet(() -> {
                NotificationPreference defaultPreference = new NotificationPreference();
                defaultPreference.setUserId(userId);
                defaultPreference.setSeverityThreshold("HIGH");
                defaultPreference.setEmailEnabled(true);
                defaultPreference.setWebsocketEnabled(true);
                return notificationPreferenceRepository.save(defaultPreference);
            });
    }

    @Override
    @Transactional
    public NotificationPreference updateNotificationPreferences(Long userId, NotificationPreference preferences) {
        NotificationPreference existingPreference = notificationPreferenceRepository.findByUserId(userId)
            .orElseGet(() -> {
                NotificationPreference newPreference = new NotificationPreference();
                newPreference.setUserId(userId);
                return newPreference;
            });

        existingPreference.setSeverityThreshold(preferences.getSeverityThreshold());
        existingPreference.setEmailEnabled(preferences.isEmailEnabled());
        existingPreference.setWebsocketEnabled(preferences.isWebsocketEnabled());

        return notificationPreferenceRepository.save(existingPreference);
    }

    private String generateNotificationTitle(Notification.NotificationType type, String componentName, String cveId) {
        switch (type) {
            case NEW_VULNERABILITY:
                return String.format("New vulnerability found in %s (%s)", componentName, cveId);
            case VULNERABILITY_UPDATED:
                return String.format("Vulnerability updated in %s (%s)", componentName, cveId);
            case VULNERABILITY_FIXED:
                return String.format("Vulnerability fixed in %s (%s)", componentName, cveId);
            default:
                return "Vulnerability notification";
        }
    }

    private String generateNotificationMessage(Notification.NotificationType type, String componentName, 
                                             String cveId, String description) {
        switch (type) {
            case NEW_VULNERABILITY:
                return String.format("A new vulnerability (%s) has been detected in component %s. %s", 
                    cveId, componentName, description);
            case VULNERABILITY_UPDATED:
                return String.format("The vulnerability (%s) in component %s has been updated. %s", 
                    cveId, componentName, description);
            case VULNERABILITY_FIXED:
                return String.format("The vulnerability (%s) in component %s has been fixed. %s", 
                    cveId, componentName, description);
            default:
                return description;
        }
    }
} 