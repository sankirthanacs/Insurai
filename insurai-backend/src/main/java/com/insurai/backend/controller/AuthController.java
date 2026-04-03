package com.insurai.backend.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.insurai.backend.model.ApiResponse;
import com.insurai.backend.model.AuthRequest;
import com.insurai.backend.model.AuthResponse;
import com.insurai.backend.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(@RequestBody AuthRequest request) {
        logger.info("Registration request received for email: {}", request.getEmail());
        logger.info("Registration request details - firstName: {}, lastName: {}", 
    request.getFirstName(), request.getLastName());
        
        try {
            String result = authService.register(request);
            logger.info("Registration successful for email: {}", request.getEmail());
            return ResponseEntity.ok(new ApiResponse(result, true));
        } catch (Exception e) {
            logger.error("Registration failed for email: {}, error: {}", request.getEmail(), e.getMessage(), e);
            return ResponseEntity.badRequest().body(new ApiResponse(e.getMessage(), false));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        try {
            logger.info("Login request received for email: {}", request.getEmail());
            String token = authService.login(request);
            logger.info("Login successful for email: {}", request.getEmail());
            return ResponseEntity.ok(new AuthResponse(token));
        } catch (RuntimeException e) {
            logger.error("Login failed for email: {}, error: {}", request.getEmail(), e.getMessage());
            return ResponseEntity.badRequest().body(new ApiResponse(e.getMessage(), false));
        } catch (Exception e) {
            logger.error("Unexpected error during login for email: {}", request.getEmail(), e);
            return ResponseEntity.status(500).body(new ApiResponse("Internal server error during login", false));
        }
    }
}