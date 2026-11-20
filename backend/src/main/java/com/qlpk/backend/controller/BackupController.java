package com.qlpk.backend.controller;

import com.qlpk.backend.service.DatabaseBackupService;
import com.qlpk.backend.service.BackblazeBackupStorageService;
import com.qlpk.backend.service.CloudBackupService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/backup")
public class BackupController {

    private static final Logger log = LoggerFactory.getLogger(BackupController.class);
    private static final DateTimeFormatter FILE_TIMESTAMP =
        DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");
    private static final DateTimeFormatter CLOUD_FILE_TIMESTAMP =
        DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss_SSS");

    private final DatabaseBackupService databaseBackupService;
    private final BackblazeBackupStorageService backblazeBackupStorageService;
    private final CloudBackupService cloudBackupService;

    public BackupController(
            DatabaseBackupService databaseBackupService,
            BackblazeBackupStorageService backblazeBackupStorageService,
            CloudBackupService cloudBackupService) {
        this.databaseBackupService = databaseBackupService;
        this.backblazeBackupStorageService = backblazeBackupStorageService;
        this.cloudBackupService = cloudBackupService;
    }

    @GetMapping("/export")
    public ResponseEntity<StreamingResponseBody> exportDatabase() {
        String baseFilename = "backup_" + LocalDateTime.now().format(FILE_TIMESTAMP);
        String filename = baseFilename + ".zip";
        String sqlEntryName = baseFilename + ".sql";
        StreamingResponseBody responseBody =
            outputStream -> databaseBackupService.writeBackupTo(outputStream, sqlEntryName);

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType("application/zip"))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .body(responseBody);
    }

    @PostMapping("/cloud")
    public ResponseEntity<BackblazeBackupStorageService.BackupMetadata> createCloudBackup()
            throws IOException {
        String baseFilename = "backup_" + LocalDateTime.now().format(CLOUD_FILE_TIMESTAMP);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(cloudBackupService.createCloudBackup(baseFilename));
    }

    @GetMapping("/cloud")
    public List<BackblazeBackupStorageService.BackupMetadata> listCloudBackups() {
        return backblazeBackupStorageService.listBackups();
    }

    @GetMapping("/cloud/download")
    public ResponseEntity<StreamingResponseBody> downloadCloudBackup(@RequestParam("key") String key) {
        backblazeBackupStorageService.validateKey(key);
        backblazeBackupStorageService.checkConfiguration();
        BackblazeBackupStorageService.BackupMetadata metadata =
            backblazeBackupStorageService.getBackupMetadata(key);
        StreamingResponseBody responseBody =
            outputStream -> backblazeBackupStorageService.downloadTo(key, outputStream);

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType("application/zip"))
            .contentLength(metadata.size())
            .header(
                HttpHeaders.CONTENT_DISPOSITION,
                ContentDisposition.attachment().filename(metadata.filename()).build().toString()
            )
            .body(responseBody);
    }

    @PostMapping("/cloud/restore")
    public ResponseEntity<Map<String, String>> restoreCloudBackup(
            @RequestBody(required = false) CloudRestoreRequest request) throws IOException {
        String key = request == null ? null : request.key();
        backblazeBackupStorageService.validateKey(key);
        backblazeBackupStorageService.checkConfiguration();

        Path temporaryZipFile = Files.createTempFile("qlpk-cloud-restore-", ".zip");
        try {
            backblazeBackupStorageService.downloadToFile(key, temporaryZipFile);
            databaseBackupService.restoreDatabase(temporaryZipFile);
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("message", "Database đã được phục hồi thành công từ bản backup cloud."));
        } finally {
            Files.deleteIfExists(temporaryZipFile);
        }
    }

    @DeleteMapping("/cloud")
    public ResponseEntity<Map<String, String>> deleteCloudBackup(@RequestParam("key") String key) {
        backblazeBackupStorageService.deleteBackup(key);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .body(Map.of("message", "Đã xóa bản backup cloud."));
    }

    @PostMapping(value = "/restore", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> restoreDatabase(@RequestParam("file") MultipartFile file) {
        try {
            databaseBackupService.restoreDatabase(file);
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("message", "Database đã được phục hồi thành công."));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest()
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("message", exception.getMessage()));
        } catch (IOException exception) {
            return ResponseEntity.internalServerError()
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("message", exception.getMessage()));
        }
    }

    @ExceptionHandler(BackblazeBackupStorageService.StorageNotConfiguredException.class)
    public ResponseEntity<Map<String, String>> handleStorageNotConfigured(
            BackblazeBackupStorageService.StorageNotConfiguredException exception) {
        return cloudError(HttpStatus.SERVICE_UNAVAILABLE, exception.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleInvalidCloudRequest(IllegalArgumentException exception) {
        return cloudError(HttpStatus.BAD_REQUEST, exception.getMessage());
    }

    @ExceptionHandler(S3Exception.class)
    public ResponseEntity<Map<String, String>> handleS3Exception(S3Exception exception) {
        log.error("Backblaze B2 request failed: {}", exception.getMessage(), exception);
        HttpStatus status = exception.statusCode() == HttpStatus.NOT_FOUND.value()
            ? HttpStatus.NOT_FOUND
            : HttpStatus.BAD_GATEWAY;
        return cloudError(status, "Backblaze B2 request failed: " + exception.getMessage());
    }

    @ExceptionHandler(SdkClientException.class)
    public ResponseEntity<Map<String, String>> handleSdkClientException(SdkClientException exception) {
        log.error("Backblaze B2 client request failed: {}", exception.getMessage(), exception);
        return cloudError(
            HttpStatus.BAD_GATEWAY,
            "Không thể kết nối hoặc gửi yêu cầu đến Backblaze B2: " + exception.getMessage()
        );
    }

    @ExceptionHandler(SdkException.class)
    public ResponseEntity<Map<String, String>> handleSdkException(SdkException exception) {
        log.error("Backblaze B2 operation failed: {}", exception.getMessage(), exception);
        return cloudError(HttpStatus.BAD_GATEWAY, "Không thể kết nối hoặc thao tác với Backblaze B2.");
    }

    @ExceptionHandler(IOException.class)
    public ResponseEntity<Map<String, String>> handleCloudIoException(IOException exception) {
        log.error("Cloud backup file operation failed: {}", exception.getMessage(), exception);
        return cloudError(HttpStatus.INTERNAL_SERVER_ERROR, exception.getMessage());
    }

    private ResponseEntity<Map<String, String>> cloudError(HttpStatus status, String message) {
        return ResponseEntity.status(status)
            .contentType(MediaType.APPLICATION_JSON)
            .body(Map.of("message", message == null ? "Cloud backup request failed." : message));
    }

    public record CloudRestoreRequest(String key) {
    }
}
