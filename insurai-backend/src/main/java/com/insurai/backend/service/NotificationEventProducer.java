package com.insurai.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.insurai.backend.entity.Notification;

@Service
public class NotificationEventProducer {

    private static final Logger log = LoggerFactory.getLogger(NotificationEventProducer.class);
    public static final String TOPIC = "insurai-notifications";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public NotificationEventProducer(@org.springframework.beans.factory.annotation.Autowired(required = false) KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
        if (kafkaTemplate == null) {
            log.info("KafkaTemplate is not available; notification events will not be published.");
        }
    }

    public void publish(Notification notification) {
        if (notification == null) {
            return;
        }
        if (kafkaTemplate == null) {
            log.debug("Skipping notification event publish (Kafka not available): {}", notification);
            return;
        }
        try {
            kafkaTemplate.send(TOPIC, String.valueOf(notification.getUserId()), notification);
            log.debug("Published notification event to topic {}: {}", TOPIC, notification);
        } catch (Exception e) {
            log.error("Failed to publish notification event", e);
        }
    }
}
