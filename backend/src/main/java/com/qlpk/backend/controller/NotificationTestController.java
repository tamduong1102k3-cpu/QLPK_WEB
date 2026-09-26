package com.qlpk.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/test-notification")
public class NotificationTestController {

    @GetMapping("/send")
    public ResponseEntity<?> sendQuick() {
        return ResponseEntity.ok(Map.of(
            "success", false,
            "message", "Endpoint test đã được gỡ bỏ"
        ));
    }

    @GetMapping("/simulate-cron")
    public ResponseEntity<?> simulateCron() {
        return ResponseEntity.ok(Map.of(
            "success", false,
            "message", "Endpoint test đã được gỡ bỏ"
        ));
    }

    @GetMapping("/send-to-all")
    public ResponseEntity<?> sendToAllQuick() {
        return ResponseEntity.ok(Map.of(
            "success", false,
            "message", "Endpoint test đã được gỡ bỏ"
        ));
    }

    @GetMapping("/tokens")
    public ResponseEntity<?> getAllTokens() {
        return ResponseEntity.ok(Map.of(
            "success", false,
            "message", "Endpoint test đã được gỡ bỏ"
        ));
    }
}
