package com.vulnview.service;

import com.vulnview.entity.Notification;
import com.vulnview.entity.NotificationPreference;
import com.vulnview.entity.Project;
import com.vulnview.entity.RiskLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface NotificationService {
    /**
     * Create a new notification for a high-severity vulnerability
     * @param projectId The project ID
     * @param componentId The component ID
     * @param vulnerabilityId The vulnerability ID
     * @param severity The severity level
     * @param type The notification type
     * @return The created notification
     */
    Notification createVulnerabilityNotification(Long projectId, Long componentId, Long vulnerabilityId, 
                                               RiskLevel severity, Notification.NotificationType type);
    
    /**
     * Get unread notifications for a project
     * @param projectId The project ID
     * @param pageable Pagination parameters
     * @return Page of notifications
     */
    Page<Notification> getUnreadNotifications(Long projectId, Pageable pageable);
    
    /**
     * Get unread high-severity notifications for a project
     * @param projectId The project ID
     * @return List of notifications
     */
    List<Notification> getUnreadHighSeverityNotifications(Long projectId);
    
    /**
     * Mark a notification as read
     * @param notificationId The ID of the notification
     */
    void markAsRead(Long notificationId);
    
    /**
     * Mark all notifications for a project as read
     * @param projectId The project ID
     */
    void markAllAsRead(Long projectId);
    
    /**
     * Get count of unread notifications for a project
     * @param projectId The project ID
     * @return Count of unread notifications
     */
    long getUnreadCount(Long projectId);
    
    /**
     * Get count of unread high-severity notifications for a project
     * @param projectId The project ID
     * @return Count of unread high-severity notifications
     */
    long getUnreadHighSeverityCount(Long projectId);

    List<Notification> getProjectNotifications(Long projectId);
    void markNotificationAsRead(Long projectId, Long notificationId);
    void deleteNotification(Long projectId, Long notificationId);
    NotificationPreference getNotificationPreferences(Long projectId);
    NotificationPreference updateNotificationPreferences(Long projectId, NotificationPreference preferences);
} 