package com.insurai.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Conditional;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.insurai.backend.config.KafkaEnabledCondition;
import com.insurai.backend.entity.Notification;

@Component
@Conditional(KafkaEnabledCondition.class)
public class NotificationEventListener {

    private static final Logger log = LoggerFactory.getLogger(NotificationEventListener.class);

    private final NotificationSseService notificationSseService;

    public NotificationEventListener(NotificationSseService notificationSseService) {
        this.notificationSseService = notificationSseService;
    }

    @KafkaListener(topics = NotificationEventProducer.TOPIC, groupId = "insurai-group")
    public void onNotification(Notification notification) {
        if (notification == null) {
            return;
        }
        log.info("Received notification event: {} -> {}", notification.getUserId(), notification.getTitle());
        notificationSseService.broadcast(notification);
    }
}
