package com.insurai.backend.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.insurai.backend.service.ChatService;

@RestController
@RequestMapping("/api/chatbot")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping("/message")
    public ResponseEntity<Map<String, String>> handleChatMessage(@RequestBody Map<String, String> request) {
        String message = request.get("message");
        String userId = request.get("userId");

        String response = chatService.processMessage(message, userId);

        Map<String, String> responseData = new HashMap<>();
        responseData.put("response", response);
        responseData.put("userId", userId);
        responseData.put("timestamp", System.currentTimeMillis() + "");

        return ResponseEntity.ok(responseData);
    }
}
