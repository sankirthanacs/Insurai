package com.insurai.backend.security;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(jakarta.servlet.http.HttpServletRequest request,
                                    jakarta.servlet.http.HttpServletResponse response,
                                    jakarta.servlet.FilterChain filterChain) throws jakarta.servlet.ServletException, IOException {
        try {
            String token = null;
            String authHeader = request.getHeader("Authorization");

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            } else if (authHeader != null && !authHeader.isBlank()) {
                token = authHeader;
            }

            if (token == null || token.isBlank()) {
                String tokenParam = request.getParameter("token");
                if (tokenParam != null && !tokenParam.isBlank()) {
                    token = tokenParam.startsWith("Bearer ") ? tokenParam.substring(7) : tokenParam;
                }
            }

            if (token != null && !token.isBlank()) {
                String email = jwtUtil.extractUsername(token);
                String role = jwtUtil.extractRole(token);

                if (email != null) {
                    Collection<GrantedAuthority> authorities = new ArrayList<>();

                    if (role != null && !role.isBlank()) {
                        String normalizedRole = role.toUpperCase();
                        if (normalizedRole.startsWith("ROLE_")) {
                            normalizedRole = normalizedRole.substring(5);
                        }
                        authorities.add(new SimpleGrantedAuthority("ROLE_" + normalizedRole));
                    } else {
                        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
                    }

                    UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(email, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            }
        } catch (Exception e) {
            System.err.println("JWT parse error in JwtFilter: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}