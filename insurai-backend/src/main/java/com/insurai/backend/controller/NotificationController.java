package com.insurai.backend.controller;

import com.insurai.backend.entity.Notification;
import com.insurai.backend.service.NotificationService;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getAllNotifications() {
        return ResponseEntity.ok(notificationService.getAllNotifications());
    }

    @GetMapping("/user")
    public ResponseEntity<Map<String, Object>> getUserNotifications(Authentication authentication) {
        String userEmail = authentication.getName();
        List<Notification> notifications = notificationService.getUserNotifications(userEmail);
        return ResponseEntity.ok(Map.of(
            "notifications", notifications,
            "unreadCount", notifications.stream().filter(n -> !n.isRead()).count()
        ));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(@PathVariable Long id) {
        Notification notification = notificationService.markAsRead(id);
        return ResponseEntity.ok(notification);
    }

    @PostMapping("/mark-all-read")
    public ResponseEntity<?> markAllRead(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        String userEmail = authentication.getName();
        List<Notification> readNotifications = notificationService.markAllAsRead(userEmail);
        return ResponseEntity.ok(Map.of("notifications", readNotifications, "unreadCount", 0));
    }

    @PostMapping
    public ResponseEntity<Notification> createNotification(@RequestBody Notification notification) {
        return ResponseEntity.ok(notificationService.saveNotification(notification));
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamNotifications(Authentication authentication) {
        // Ensure the stream is scoped to the authenticated user so they only receive their own notifications
        String userEmail = authentication.getName();
        Long userId = notificationService.getUserByEmail(userEmail).getId();
        return notificationService.getSseEmitter(userId);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.noContent().build();
    }
}
