package com.insurai.backend.controller;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.insurai.backend.entity.User;
import com.insurai.backend.model.ApiResponse;
import com.insurai.backend.model.AuthRequest;
import com.insurai.backend.model.AuthResponse;
import com.insurai.backend.service.AuthService;
import com.insurai.backend.repository.UserRepository;

@RestController
@RequestMapping("/api/test")
public class TestController {

    private static final Logger logger = LoggerFactory.getLogger(TestController.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthService authService;

    /**
     * Create a test user directly in the database
     * This bypasses the normal registration process for debugging
     */
    @PostMapping("/create-user")
    public ResponseEntity<ApiResponse> createTestUser(@RequestBody AuthRequest request) {
        try {
            logger.info("Creating test user: {}", request.getEmail());
            
            // Check if user already exists
            if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                return ResponseEntity.badRequest().body(new ApiResponse("User already exists", false));
            }

            // Create user using the existing registration logic
            String result = authService.register(request);
            logger.info("Test user created successfully: {}", request.getEmail());
            
            return ResponseEntity.ok(new ApiResponse(result, true));
        } catch (Exception e) {
            logger.error("Error creating test user: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(new ApiResponse("Failed to create test user: " + e.getMessage(), false));
        }
    }

    /**
     * List all users in the database for debugging
     */
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        try {
            List<User> users = userRepository.findAll();
            logger.info("Retrieved {} users from database", users.size());
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            logger.error("Error retrieving users: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(null);
        }
    }

    /**
     * Test login endpoint for debugging
     */
    @PostMapping("/login")
    public ResponseEntity<?> testLogin(@RequestBody AuthRequest request) {
        try {
            logger.info("Testing login for user: {}", request.getEmail());
            String token = authService.login(request);
            logger.info("Login successful for user: {}", request.getEmail());
            return ResponseEntity.ok(new AuthResponse(token));
        } catch (RuntimeException e) {
            logger.error("Login failed for user: {}, error: {}", request.getEmail(), e.getMessage());
            return ResponseEntity.badRequest().body(new ApiResponse(e.getMessage(), false));
        } catch (Exception e) {
            logger.error("Unexpected error during login for user: {}", request.getEmail(), e);
            return ResponseEntity.status(500).body(new ApiResponse("Internal server error during login", false));
        }
    }

    /**
     * Root test endpoint for backend connectivity check
     */
    @GetMapping
    public ResponseEntity<ApiResponse> rootTest() {
        return ResponseEntity.ok(new ApiResponse("Backend is running", true));
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<ApiResponse> healthCheck() {
        return ResponseEntity.ok(new ApiResponse("Test endpoints are working", true));
    }
}
