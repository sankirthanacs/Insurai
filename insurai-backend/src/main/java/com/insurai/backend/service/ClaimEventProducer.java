package com.insurai.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.insurai.backend.entity.Claim;

@Service
public class ClaimEventProducer {

    private static final Logger log = LoggerFactory.getLogger(ClaimEventProducer.class);
    public static final String TOPIC = "insurai-claims";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public ClaimEventProducer(@org.springframework.beans.factory.annotation.Autowired(required = false) KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
        if (kafkaTemplate == null) {
            log.info("KafkaTemplate is not available; events will not be published.");
        }
    }

    public void publish(Claim claim) {
        if (claim == null) return;
        if (kafkaTemplate == null) {
            // No Kafka available in this environment
            log.debug("Skipping claim event publish because Kafka is not configured");
            return;
        }
        try {
            kafkaTemplate.send(TOPIC, String.valueOf(claim.getId()), claim);
            log.debug("Published claim event to topic {}: {}", TOPIC, claim.getId());
        } catch (Exception e) {
            log.error("Failed to publish claim event", e);
        }
    }
}
