package com.qlpk.backend.controller;

import com.qlpk.backend.service.NotificationQueueService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/internal")
public class NotificationInternalController {

    private static final Logger log = LoggerFactory.getLogger(NotificationInternalController.class);

    private static final String SECRET_HEADER = "X-Internal-Secret";

    @Autowired
    private NotificationQueueService notificationQueueService;

    @Value("${internal.notification.secret:}")
    private String internalNotificationSecret;

    @PostMapping("/notifications/process")
    public ResponseEntity<?> processNotifications(
            @RequestHeader(value = SECRET_HEADER, required = false) String secret) {

        if (!isValidSecret(secret)) {
            log.warn("Rejected /api/internal/notifications/process with invalid or missing secret");
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of(
                    "success", false,
                    "message", "Invalid or missing secret"
                ));
        }

        log.info("=== Cron-job triggered: processing notification queue ===");
        long start = System.currentTimeMillis();

        Map<String, Integer> result = notificationQueueService.processQueue();

        long elapsed = System.currentTimeMillis() - start;
        log.info("=== Queue processing done in {}ms: processed={}, sent={}, failed={} ===",
            elapsed, result.get("processed"), result.get("sent"), result.get("failed"));

        return ResponseEntity.ok(Map.of(
            "success", true,
            "processed", result.get("processed"),
            "sent", result.get("sent"),
            "failed", result.get("failed"),
            "elapsedMs", elapsed
        ));
    }

    private boolean isValidSecret(String secret) {

        if (internalNotificationSecret == null || internalNotificationSecret.isEmpty()) {
            log.error("INTERNAL_NOTIFICATION_SECRET is not configured. Rejecting internal calls.");
            return false;
        }
        return internalNotificationSecret.equals(secret);
    }
}
