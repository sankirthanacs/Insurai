package com.insurai.backend.service;

import com.insurai.backend.DashboardWebSocketHandler;
import com.insurai.backend.entity.Notification;
import com.insurai.backend.entity.User;
import com.insurai.backend.repository.NotificationRepository;
import com.insurai.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.util.*;
import java.time.LocalDateTime;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationEventProducer notificationEventProducer;

    @Autowired
    private NotificationSseService notificationSseService;

    @Autowired
    private DashboardWebSocketHandler dashboardWebSocketHandler;

    public List<Notification> getAllNotifications() {
        return notificationRepository.findAll();
    }

    public User getUserByEmail(String userEmail) {
        if (userEmail == null || userEmail.trim().isEmpty()) {
            throw new RuntimeException("Email cannot be null or empty");
        }
        
        String email = userEmail.trim();
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(email);
        
        if (userOpt.isPresent()) {
            return userOpt.get();
        } else {
            // Try the old method as fallback
            Optional<User> userOptOld = userRepository.findByEmail(email);
            if (userOptOld.isPresent()) {
                return userOptOld.get();
            } else {
                throw new RuntimeException("User not found with email: " + email);
            }
        }
    }

    public List<Notification> getUserNotifications(String userEmail) {
        User user = getUserByEmail(userEmail);
        return notificationRepository.findByUserId(user.getId());
    }

    public Notification markAsRead(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    public List<Notification> markAllAsRead(String userEmail) {
        User user = getUserByEmail(userEmail);
        List<Notification> notifications = notificationRepository.findByUserId(user.getId());
        notifications.stream()
            .filter(n -> !n.isRead())
            .forEach(n -> {
                n.setRead(true);
                notificationRepository.save(n);
            });
        return notificationRepository.findByUserId(user.getId());
    }

    public SseEmitter getSseEmitter(Long userId) {
        return notificationSseService.registerClient(userId);
    }

    public Notification saveNotification(Notification notification) {
        if (notification.getCreatedDate() == null) {
            notification.setCreatedDate(LocalDateTime.now());
        }
        if (!notification.isRead()) {
            notification.setRead(false);
        }

        Notification saved = notificationRepository.save(notification);

        // Publish a real-time event for downstream consumers (e.g., WebSocket push, analytics)
        try {
            notificationEventProducer.publish(saved);
        } catch (Exception e) {
            System.err.println("Failed to publish notification event: " + e.getMessage());
        }
        
        try {
            notificationSseService.broadcast(saved);
        } catch (Exception e) {
            System.err.println("Failed to broadcast notification via SSE: " + e.getMessage());
        }

        try {
            String payload = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(
                    Map.of("type", "notification", "notification", saved));
            dashboardWebSocketHandler.broadcastMessage(payload);
        } catch (Exception e) {
            // Log and continue without blocking persistence if websocket broadcast fails
            System.err.println("Failed to broadcast notification via WebSocket: " + e.getMessage());
        }

        return saved;
    }

    public void deleteNotification(Long id) {
        notificationRepository.deleteById(id);
    }
}
