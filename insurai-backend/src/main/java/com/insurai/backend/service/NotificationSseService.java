package com.insurai.backend.service;

import com.insurai.backend.entity.Notification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

@Service
public class NotificationSseService {

    private static final Logger log = LoggerFactory.getLogger(NotificationSseService.class);

    // Maintain one emitter set per userId so that each user only receives their own notifications.
    private final Map<Long, Set<SseEmitter>> emittersByUser = new ConcurrentHashMap<>();

    public SseEmitter registerClient(Long userId) {
        SseEmitter emitter = new SseEmitter(0L); // never timeout
        emittersByUser.computeIfAbsent(userId, k -> new CopyOnWriteArraySet<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(userId, emitter));
        emitter.onTimeout(() -> removeEmitter(userId, emitter));
        emitter.onError((e) -> removeEmitter(userId, emitter));

        return emitter;
    }

    public void broadcast(Notification notification) {
        if (notification == null || notification.getUserId() == null) return;

        Set<SseEmitter> emitters = emittersByUser.get(notification.getUserId());
        if (emitters == null || emitters.isEmpty()) return;

        emitters.forEach(emitter -> {
            try {
                emitter.send(SseEmitter.event()
                        .name("notification")
                        .data(notification));
            } catch (IOException e) {
                log.debug("Removing failing emitter for user {}", notification.getUserId(), e);
                removeEmitter(notification.getUserId(), emitter);
            }
        });
    }

    private void removeEmitter(Long userId, SseEmitter emitter) {
        Set<SseEmitter> emitters = emittersByUser.get(userId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                emittersByUser.remove(userId);
            }
        }
    }
}
