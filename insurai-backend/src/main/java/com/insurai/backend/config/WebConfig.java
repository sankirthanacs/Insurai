package com.insurai.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve the frontend static files from the sibling "frontend" folder.
        // This allows the backend server on port 8080 to serve the HTML/CSS/JS.
        // Serve all static frontend files (HTML/CSS/JS/images/etc.) from the sibling "frontend" folder.
        registry.addResourceHandler("/**")
                .addResourceLocations("file:../frontend/");
    }
}
