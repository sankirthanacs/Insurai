package com.insurai.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(
                    "https://insurai-mglx.vercel.app",
                    "https://insurai-1iumsz65g-sankirthanas-projects.vercel.app",
                    "https://insurai-7yochabcc-sankirthanas-projects.vercel.app",
                    "https://insurai-eight.vercel.app",
                    "https://insurai.railway.app",
                    "https://insurai-lhup.onrender.com",
                    "http://localhost:5173",
                    "http://localhost:8080",
                    "http://127.0.0.1:8080"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
