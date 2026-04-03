package com.insurai.backend.service;

import java.time.LocalDateTime;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.insurai.backend.entity.Policy;
import com.insurai.backend.entity.Role;
import com.insurai.backend.entity.Subscription;
import com.insurai.backend.entity.User;
import com.insurai.backend.model.AuthRequest;
import com.insurai.backend.repository.PolicyRepository;
import com.insurai.backend.repository.RoleRepository;
import com.insurai.backend.repository.SubscriptionRepository;
import com.insurai.backend.repository.UserRepository;
import com.insurai.backend.security.JwtUtil;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PolicyRepository policyRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, RoleRepository roleRepository,
                       PolicyRepository policyRepository, SubscriptionRepository subscriptionRepository,
                       PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.policyRepository = policyRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public String register(AuthRequest authRequest) {
        logger.info("Starting registration process for email: {}", authRequest.getEmail());
        
        // Use case-insensitive email check to prevent duplicate registrations
        if (userRepository.findByEmailIgnoreCase(authRequest.getEmail().trim()).isPresent()) {
            logger.warn("Registration failed: User already exists for email: {}", authRequest.getEmail());
            throw new RuntimeException("User already exists");
        }

        // Determine role (use provided role if valid, else default to USER)
        Role role;
        if (authRequest.getRole() != null && !authRequest.getRole().isEmpty()) {
            // Try to find the role with ROLE_ prefix first, then without
            final String roleName = authRequest.getRole().toUpperCase().startsWith("ROLE_") 
                ? authRequest.getRole().toUpperCase() 
                : "ROLE_" + authRequest.getRole().toUpperCase();
            role = roleRepository.findByName(roleName)
                .orElseGet(() -> {
                    logger.warn("Role {} not found, defaulting to ROLE_USER", roleName);
                    return roleRepository.findByName("ROLE_USER")
                        .orElseThrow(() -> new RuntimeException("Default USER role not found"));
                });
            logger.info("Using provided role: {}", role.getName());
        } else {
            role = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new RuntimeException("Default USER role not found"));
            logger.info("No role provided, defaulting to ROLE_USER");
        }
        
        User newUser = new User();
        newUser.setEmail(authRequest.getEmail());
        newUser.setUsername(authRequest.getEmail());
        newUser.setPassword(passwordEncoder.encode(authRequest.getPassword()));
        newUser.setRole(role);
        
        // Set firstName and lastName from registration
        if (authRequest.getFirstName() != null) {
            newUser.setFirstName(authRequest.getFirstName());
        }
        if (authRequest.getLastName() != null) {
            newUser.setLastName(authRequest.getLastName());
        }
        
        // Set default preferences
        newUser.setLanguage("en");
        newUser.setCurrency("USD");
        newUser.setTimezone("UTC");
        newUser.setTheme("light");

User savedUser = userRepository.saveAndFlush(newUser);
logger.info("User saved to database with ID: {} for email: {}", savedUser.getId(), authRequest.getEmail());
long count = userRepository.count();
logger.info("TOTAL USERS IN DB AFTER SAVE: {}", count);

        // Do not seed dummy policies for new users. Let users add their own policies.

        // Seed a default subscription for new users to enable real-time updates and dashboard visibility
        Subscription defaultSubscription = new Subscription();
        defaultSubscription.setUserId(newUser.getId());
        defaultSubscription.setPlan("Professional");
        defaultSubscription.setStatus("ACTIVE");
        defaultSubscription.setStartDate(LocalDateTime.now());
        defaultSubscription.setRenewalDate(LocalDateTime.now().plusMonths(1));
        defaultSubscription.setCost(java.math.BigDecimal.valueOf(29.99));
        defaultSubscription.setUpdatedDate(LocalDateTime.now());
       subscriptionRepository.save(defaultSubscription);
        logger.info("Default subscription created for user: {}", authRequest.getEmail());

        logger.info("Registration completed successfully for email: {}", authRequest.getEmail());
        return "User registered successfully";
    }

    @Transactional(readOnly = true)
    public String login(AuthRequest authRequest) {
        logger.info("Attempting login for user: {}", authRequest.getEmail());
        
Optional<User> userOptional =
    userRepository.findByEmailIgnoreCase(authRequest.getEmail().trim());        if (userOptional.isEmpty()) {
            logger.warn("Login failed: User not found for email: {}", authRequest.getEmail());
            throw new RuntimeException("User not found");
        }

        User user = userOptional.get();
        
        if (!passwordEncoder.matches(authRequest.getPassword(), user.getPassword())) {
            logger.warn("Login failed: Invalid credentials for user: {}", authRequest.getEmail());
            throw new RuntimeException("Invalid credentials");
        }

        // Safely get role name with fallback to "USER"
        String roleName = "USER";
        if (user.getRole() != null && user.getRole().getName() != null) {
            roleName = user.getRole().getName();
            logger.debug("User role found: {}", roleName);
        } else {
            logger.warn("User role is null for user: {}, defaulting to USER", authRequest.getEmail());
        }
        
        // Normalize role to no ROLE_ prefix for token claims; JwtFilter handles prefixing.
        if (roleName.toUpperCase().startsWith("ROLE_")) {
            roleName = roleName.substring(5);
            logger.debug("Role prefix removed, final role: {}", roleName);
        }
        
        String token = jwtUtil.generateToken(user.getEmail(), roleName);
        logger.info("Login successful for user: {}", authRequest.getEmail());
        
        return token;
    }
}