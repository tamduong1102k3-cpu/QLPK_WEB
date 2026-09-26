package com.qlpk.backend.controller;

import com.qlpk.backend.service.DatabaseBackupService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/backup")
public class BackupController {

    private static final Logger logger = LoggerFactory.getLogger(BackupController.class);

    @Autowired
    private DatabaseBackupService backupService;

    @GetMapping("/export")
    public ResponseEntity<?> exportBackup() {
        logger.info("API GET /api/backup/export được gọi");
        try {
            return ResponseEntity.ok(backupService.createBackup());
        } catch (RuntimeException e) {
            logger.error("Lỗi export backup: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/restore/{filename}")
    public ResponseEntity<?> restoreBackup(@PathVariable String filename) {
        logger.info("API POST /api/backup/restore/{} được gọi", filename);
        try {
            return ResponseEntity.ok(backupService.restoreFromBackup(filename));
        } catch (RuntimeException e) {
            logger.error("Lỗi restore: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", e.getMessage()));
        }
    }
}
