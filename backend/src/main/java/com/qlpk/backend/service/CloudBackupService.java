package com.qlpk.backend.service;

import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
public class CloudBackupService {

    private final DatabaseBackupService databaseBackupService;
    private final BackblazeBackupStorageService backblazeBackupStorageService;

    public CloudBackupService(
            DatabaseBackupService databaseBackupService,
            BackblazeBackupStorageService backblazeBackupStorageService) {
        this.databaseBackupService = databaseBackupService;
        this.backblazeBackupStorageService = backblazeBackupStorageService;
    }

    public BackblazeBackupStorageService.BackupMetadata createCloudBackup(String baseFilename)
            throws IOException {
        backblazeBackupStorageService.checkConfiguration();
        Path temporaryZipFile = Files.createTempFile("qlpk-cloud-backup-", ".zip");

        try {
            databaseBackupService.writeBackupTo(temporaryZipFile, baseFilename + ".sql");
            return backblazeBackupStorageService.uploadBackup(
                temporaryZipFile,
                "backups/" + baseFilename + ".zip"
            );
        } finally {
            Files.deleteIfExists(temporaryZipFile);
        }
    }
}
