package com.insurai.backend.config;

import java.net.InetSocketAddress;
import java.net.Socket;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.core.env.Environment;
import org.springframework.core.type.AnnotatedTypeMetadata;

/**
 * Enables Kafka configuration only when Kafka is reachable (or explicitly enabled).
 *
 * <p>This allows the application to start normally even if Kafka is not running locally.
 */
public class KafkaEnabledCondition implements Condition {

    private static final Logger log = LoggerFactory.getLogger(KafkaEnabledCondition.class);

    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
        Environment env = context.getEnvironment();

        // Check explicit enable/disable first
        String enabledProp = env.getProperty("insurai.kafka.enabled");
        if (enabledProp != null) {
            boolean enabled = Boolean.parseBoolean(enabledProp);
            log.info("Kafka enabled explicitly set to {}", enabled);
            return enabled;
        }

        // Check environment variable
        String kafkaEnabledEnv = env.getProperty("KAFKA_ENABLED");
        if (kafkaEnabledEnv != null) {
            boolean enabled = Boolean.parseBoolean(kafkaEnabledEnv);
            log.info("Kafka enabled via KAFKA_ENABLED env var: {}", enabled);
            return enabled;
        }

        // Auto-detect by trying to connect
        String bootstrapServers = env.getProperty("spring.kafka.bootstrap-servers", "localhost:9092");
        boolean reachable = isBootstrapReachable(bootstrapServers, 1000); // Increased timeout for better detection
        log.info("Kafka auto-detect ({}) => {}", bootstrapServers, reachable ? "enabled" : "disabled");
        return reachable;
    }

    private boolean isBootstrapReachable(String bootstrapServers, int timeoutMs) {
        if (bootstrapServers == null || bootstrapServers.isBlank()) {
            return false;
        }

        for (String server : bootstrapServers.split(",")) {
            server = server.trim();
            if (server.isEmpty()) {
                continue;
            }

            String host = server;
            int port = 9092;
            if (server.contains(":")) {
                String[] parts = server.split(":", 2);
                host = parts[0];
                try {
                    port = Integer.parseInt(parts[1]);
                } catch (NumberFormatException ignored) {
                }
            }

            try (Socket socket = new Socket()) {
                socket.connect(new InetSocketAddress(host, port), timeoutMs);
                return true;
            } catch (Exception e) {
                // ignore and try next server
            }
        }

        return false;
    }
}
