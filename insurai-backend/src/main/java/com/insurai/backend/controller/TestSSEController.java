package com.insurai.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/test")
public class TestSSEController {

    private static final Logger log = LoggerFactory.getLogger(TestSSEController.class);
    private final CopyOnWriteArrayList<SseEmitter> sseEmitters = new CopyOnWriteArrayList<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

    public TestSSEController() {
        // Start periodic updates every 10 seconds for testing
        scheduler.scheduleAtFixedRate(this::broadcastTestUpdates, 0, 10, TimeUnit.SECONDS);
    }

    @GetMapping("/sse-test")
    public SseEmitter streamTestUpdates() {
        log.info("Test SSE connection requested");
        SseEmitter emitter = new SseEmitter(300000L); // 5 minutes timeout
        
        emitter.onCompletion(() -> {
            log.info("Test SSE connection completed");
            sseEmitters.remove(emitter);
        });
        
        emitter.onTimeout(() -> {
            log.info("Test SSE connection timed out");
            emitter.complete();
            sseEmitters.remove(emitter);
        });
        
        emitter.onError((e) -> {
            log.error("Test SSE connection error", e);
            sseEmitters.remove(emitter);
        });
        
        sseEmitters.add(emitter);
        return emitter;
    }

    @GetMapping("/sse-test-data")
    public ResponseEntity<Object> getTestData() {
        log.info("Test data requested");
        return ResponseEntity.ok(Map.of(
            "message", "SSE endpoint is working!",
            "timestamp", System.currentTimeMillis(),
            "status", "success"
        ));
    }

    private void broadcastTestUpdates() {
        try {
            // Create sample update data
            String updateData = String.format("{\"type\":\"TEST_UPDATE\",\"timestamp\":%d,\"data\":{\"message\":\"Hello from SSE!\",\"count\":%d}}", 
                System.currentTimeMillis(), 
                (int)(Math.random() * 100));
            
            // Send to all connected SSE clients
            for (SseEmitter emitter : sseEmitters) {
                try {
                    emitter.send(SseEmitter.event()
                        .name("test-update")
                        .data(updateData));
                } catch (IOException e) {
                    log.error("Error sending test SSE update", e);
                    emitter.completeWithError(e);
                    sseEmitters.remove(emitter);
                }
            }
        } catch (Exception e) {
            log.error("Error broadcasting test updates", e);
        }
    }
}