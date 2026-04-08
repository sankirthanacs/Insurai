package com.insurai.backend;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.insurai.backend.entity.Role;
import com.insurai.backend.entity.User;
import com.insurai.backend.repository.RoleRepository;
import com.insurai.backend.repository.UserRepository;

@SpringBootApplication(exclude = KafkaAutoConfiguration.class)
public class InsuraiBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(InsuraiBackendApplication.class, args);
    }

   @Bean
public CommandLineRunner seedBasicRoles(
        RoleRepository roleRepository,
        UserRepository userRepository,
        PasswordEncoder passwordEncoder
) {
    return args -> {

        // ✅ SAVE roles FIRST (force DB insert) - Use the same naming as in the database
        Role userRole = roleRepository.save(
                roleRepository.findByName("ROLE_USER")
                        .orElse(new Role(null, "ROLE_USER", "Regular user"))
        );

        Role adminRole = roleRepository.save(
                roleRepository.findByName("ROLE_ADMIN")
                        .orElse(new Role(null, "ROLE_ADMIN", "Administrator"))
        );

        Role hrRole = roleRepository.save(
                roleRepository.findByName("ROLE_HR")
                        .orElse(new Role(null, "ROLE_HR", "Human Resources"))
        );

        Role riskRole = roleRepository.save(
                roleRepository.findByName("ROLE_RISK_ANALYST")
                        .orElse(new Role(null, "ROLE_RISK_ANALYST", "Risk Analyst"))
        );

        Role underwriterRole = roleRepository.save(
                roleRepository.findByName("ROLE_UNDERWRITER")
                        .orElse(new Role(null, "ROLE_UNDERWRITER", "Policy Underwriter"))
        );

        // ✅ NOW roles are guaranteed in DB

        if (userRepository.findByEmail("admin@test.com").isEmpty()) {
            User admin = new User();
            admin.setEmail("admin@test.com");
            admin.setUsername("admin@test.com");
            admin.setPassword(passwordEncoder.encode("password"));
            admin.setFirstName("Admin");
            admin.setLastName("User");
            admin.setRole(adminRole);
            userRepository.save(admin);
        }

        if (userRepository.findByEmail("user@test.com").isEmpty()) {
            User user = new User();
            user.setEmail("user@test.com");
            user.setUsername("user@test.com");
            user.setPassword(passwordEncoder.encode("password"));
            user.setFirstName("Regular");
            user.setLastName("User");
            user.setRole(userRole);
            userRepository.save(user);
        }

        // Seed default underwriter account
        if (userRepository.findByEmail("jhon.doe@example.com").isEmpty()) {
            User underwriter = new User();
            underwriter.setEmail("jhon.doe@example.com");
            underwriter.setUsername("jhon.doe@example.com");
            underwriter.setPassword(passwordEncoder.encode("password"));
            underwriter.setFirstName("Jhon");
            underwriter.setLastName("Doe");
            underwriter.setRole(underwriterRole);
            userRepository.save(underwriter);
            System.out.println("Default underwriter account created: jhon.doe@example.com / password");
        }
    };
}
}