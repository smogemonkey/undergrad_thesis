package com.vulnview.service.impl;

import com.vulnview.dto.NotificationDto;
import com.vulnview.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public void sendNotification(String destination, NotificationDto notification) {
        log.info("Sending notification...");
        messagingTemplate.convertAndSend(destination, notification);
    }
} 