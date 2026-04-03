package com.insurai.backend.security;

import java.io.IOException;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.insurai.backend.entity.Role;
import com.insurai.backend.entity.User;
import com.insurai.backend.repository.RoleRepository;
import com.insurai.backend.repository.UserRepository;

@Component
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtUtil jwtUtil;

    public OAuth2SuccessHandler(UserRepository userRepository, RoleRepository roleRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public void onAuthenticationSuccess(jakarta.servlet.http.HttpServletRequest request, jakarta.servlet.http.HttpServletResponse response,
            Authentication authentication) throws IOException, jakarta.servlet.ServletException {
        
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        String email = oauth2User.getAttribute("email");
        String firstName = oauth2User.getAttribute("given_name");
        String lastName = oauth2User.getAttribute("family_name");
        
        // Check if user exists, if not create new user
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setUsername(email);
            newUser.setFirstName(firstName != null ? firstName : "");
            newUser.setLastName(lastName != null ? lastName : "");
            newUser.setPassword(""); // OAuth2 users don't have passwords
            
            // Set default role as USER
            Role userRole = roleRepository.findByName("USER")
                .orElseThrow(() -> new RuntimeException("Default USER role not found"));
            newUser.setRole(userRole);
            
            // Set default preferences
            newUser.setLanguage("en");
            newUser.setCurrency("USD");
            newUser.setTimezone("UTC");
            newUser.setTheme("light");
            
            return userRepository.save(newUser);
        });

        // Generate JWT token including role claim
        String roleName = user.getRole() != null ? user.getRole().getName() : "USER";
        String token = jwtUtil.generateToken(email, roleName);

        // Redirect to frontend with token
        // Adjust this URL based on where your frontend is hosted
        String redirectUrl = "http://localhost:3000/frontend/user/user-dashboard.html?token=" + token;
        response.sendRedirect(redirectUrl);
    }
}
