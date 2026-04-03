package com.insurai.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.insurai.backend.dto.LoginRequest;
import com.insurai.backend.service.AuthService;
import com.insurai.backend.model.AuthRequest;

@RestController
@RequestMapping("/test")
public class TestLoginController {

    private static final Logger log = LoggerFactory.getLogger(TestLoginController.class);

    @Autowired
    private AuthService authService;

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        log.info("=== Test endpoint called ===");
        return ResponseEntity.ok("Test endpoint is working!");
    }

    @PostMapping("/login")
    public ResponseEntity<?> testLogin(@RequestBody LoginRequest request) {
        log.info("=== Test login called with email: {} ===", request.getEmail());
        try {
            // Convert LoginRequest to AuthRequest
            AuthRequest authRequest = new AuthRequest();
            authRequest.setEmail(request.getEmail());
            authRequest.setPassword(request.getPassword());
            
            var result = authService.login(authRequest);
            log.info("=== Test login successful ===");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("=== Test login failed ===", e);
            return ResponseEntity.badRequest().body("Login failed: " + e.getMessage());
        }
    }
}
