package com.insurai.backend;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.insurai.backend.repository.UserRepository;
import com.insurai.backend.repository.RoleRepository;

@Component
public class TestDBConnection implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(TestDBConnection.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Autowired
    public TestDBConnection(UserRepository userRepository, RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        log.info("=== Testing Database Connection ===");
        
        try {
            // Test role repository
            log.info("Testing RoleRepository...");
            var roles = roleRepository.findAll();
            log.info("Found {} roles", roles.size());
            roles.forEach(role -> log.info("Role: {} (ID: {})", role.getName(), role.getId()));
            
            // Test user repository
            log.info("Testing UserRepository...");
            var users = userRepository.findAll();
            log.info("Found {} users", users.size());
            users.forEach(user -> {
                log.info("User: {} (Email: {}), Role: {}", 
                    user.getUsername(), 
                    user.getEmail(), 
                    user.getRole() != null ? user.getRole().getName() : "NULL");
            });
            
            // Test specific user lookup
            log.info("Testing findByEmail for user@insurai.com...");
            var testUser = userRepository.findByEmail("user@insurai.com");
            if (testUser.isPresent()) {
                log.info("✓ Test user found successfully");
                log.info("  Username: {}", testUser.get().getUsername());
                log.info("  Email: {}", testUser.get().getEmail());
                log.info("  Role: {}", testUser.get().getRole() != null ? testUser.get().getRole().getName() : "NULL");
            } else {
                log.warn("✗ Test user not found!");
            }
            
            log.info("=== Database Connection Test Complete ===");
            
        } catch (Exception e) {
            log.error("Database connection test failed", e);
        }
    }
}