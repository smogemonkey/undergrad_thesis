package com.vulnview.service;

import com.vulnview.dto.NotificationDto;

public interface NotificationService {
    void sendNotification(String destination, NotificationDto dto);
} 