package com.qlpk.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ServerTimeController {

    @GetMapping("/server-time")
    public ResponseEntity<?> getServerTime() {
        String serverTime = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "serverTime", serverTime
        ));
    }
}
