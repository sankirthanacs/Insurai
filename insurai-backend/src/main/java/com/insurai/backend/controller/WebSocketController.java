package com.insurai.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/websocket")
public class WebSocketController {

    private static final Logger log = LoggerFactory.getLogger(WebSocketController.class);

    @GetMapping("/health")
    public ResponseEntity<String> websocketHealth() {
        log.info("WebSocket health check requested");
        return ResponseEntity.ok("WebSocket endpoint is active and ready");
    }

    @GetMapping("/status")
    public ResponseEntity<String> websocketStatus() {
        log.info("WebSocket status check requested");
        return ResponseEntity.ok("WebSocket service is running");
    }
}


