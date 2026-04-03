package com.insurai.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Conditional;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.insurai.backend.config.KafkaEnabledCondition;
import com.insurai.backend.entity.Claim;

@Component
@Conditional(KafkaEnabledCondition.class)
public class ClaimEventListener {

    private static final Logger log = LoggerFactory.getLogger(ClaimEventListener.class);

    @KafkaListener(topics = ClaimEventProducer.TOPIC, groupId = "insurai-group")
    public void onClaimEvent(Claim claim) {
        if (claim == null) {
            return;
        }
        log.info("Received claim event: {} status={} userId={}", claim.getId(), claim.getStatus(), claim.getUserId());
        // TODO: implement real-time downstream processing (e.g., WebSocket push, analytics, audit log)
    }
}
