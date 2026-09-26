package com.qlpk.backend.controller;

import com.qlpk.backend.service.DatabaseBackupService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/database")
public class DatabaseBackupController {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseBackupController.class);

    @Autowired
    private DatabaseBackupService databaseBackupService;

    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getInfo() {
        logger.info("API GET /api/database/info được gọi");
        return ResponseEntity.ok(databaseBackupService.getDatabaseInfo());
    }

    @GetMapping("/backups")
    public ResponseEntity<?> getBackups() {
        logger.info("API GET /api/database/backups được gọi");
        try {
            return ResponseEntity.ok(databaseBackupService.getBackups());
        } catch (RuntimeException e) {
            logger.error("Lỗi lấy backup: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/backup")
    public ResponseEntity<?> createBackup() {
        logger.info("API POST /api/database/backup được gọi");
        try {
            return ResponseEntity.ok(databaseBackupService.createBackup());
        } catch (RuntimeException e) {
            logger.error("Lỗi tạo backup: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/restore/{filename}")
    public ResponseEntity<?> restoreFromBackup(@PathVariable String filename) {
        logger.info("API POST /api/database/restore/{} được gọi", filename);
        try {
            return ResponseEntity.ok(databaseBackupService.restoreFromBackup(filename));
        } catch (RuntimeException e) {
            logger.error("Lỗi restore: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping(value = "/restore/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> restoreFromUpload(@RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        logger.info("API POST /api/database/restore/upload được gọi, file: {}", file.getOriginalFilename());
        try {

            java.nio.file.Path backupDir = java.nio.file.Paths.get("./backups").toAbsolutePath().normalize();
            java.nio.file.Files.createDirectories(backupDir);
            String filename = "upload_" + file.getOriginalFilename();
            java.nio.file.Path targetFile = backupDir.resolve(filename);
            file.transferTo(targetFile.toFile());

            Map<String, Object> result = databaseBackupService.restoreFromBackup(filename);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            logger.error("Lỗi restore upload: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            logger.error("Lỗi restore upload: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Lỗi xử lý file: " + e.getMessage()));
        }
    }
}
