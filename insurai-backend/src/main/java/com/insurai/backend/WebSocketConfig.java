package com.insurai.backend;

import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private static final Logger log = LoggerFactory.getLogger(WebSocketConfig.class);

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        log.info("Registering WebSocket handlers...");
        
        // Dashboard WebSocket endpoint for frontend - this is the main endpoint used by underwriter dashboard
        registry.addHandler(new DashboardWebSocketHandler(), "/ws/dashboard")
                .setAllowedOrigins("*")
                .setAllowedOriginPatterns("*")
                .addInterceptors(new HandshakeInterceptor() {
                    @Override
                    public boolean beforeHandshake(
                            ServerHttpRequest request, ServerHttpResponse response,
                            WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
                        log.info("WebSocket handshake initiated from: {}", request.getRemoteAddress());
                        response.getHeaders().set("Keep-Alive", "timeout=600, max=100");
                        response.getHeaders().set("Access-Control-Allow-Origin", "*");
                        response.getHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
                        response.getHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
                        return true;
                    }

                    @Override
                    public void afterHandshake(
                            ServerHttpRequest request, ServerHttpResponse response,
                            WebSocketHandler wsHandler, Exception exception) {
                        log.info("WebSocket handshake completed successfully");
                    }
                });

        // Additional real-time endpoints for different dashboard types
        registry.addHandler(new DashboardWebSocketHandler(), "/ws/claims")
                .setAllowedOrigins("*")
                .setAllowedOriginPatterns("*");

        registry.addHandler(new DashboardWebSocketHandler(), "/ws/policies")
                .setAllowedOrigins("*")
                .setAllowedOriginPatterns("*");

        registry.addHandler(new DashboardWebSocketHandler(), "/ws/fraud")
                .setAllowedOrigins("*")
                .setAllowedOriginPatterns("*");

        registry.addHandler(new DashboardWebSocketHandler(), "/ws/notifications")
                .setAllowedOrigins("*")
                .setAllowedOriginPatterns("*");

        log.info("WebSocket handlers registered successfully");
    }
}
