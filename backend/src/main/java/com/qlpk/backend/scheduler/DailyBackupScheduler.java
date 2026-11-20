package com.qlpk.backend.scheduler;

import com.qlpk.backend.service.BackblazeBackupStorageService;
import com.qlpk.backend.service.CloudBackupService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.atomic.AtomicBoolean;

@Component
public class DailyBackupScheduler {

    private static final Logger log = LoggerFactory.getLogger(DailyBackupScheduler.class);
    private static final String AUTOMATIC_BACKUP_PREFIX = "backups/backup_auto_";
    private static final DateTimeFormatter FILE_TIMESTAMP =
        DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");

    private final BackblazeBackupStorageService backblazeBackupStorageService;
    private final CloudBackupService cloudBackupService;
    private final boolean enabled;
    private final String scheduleZone;
    private final int retentionDays;
    private final AtomicBoolean backupInProgress = new AtomicBoolean(false);

    public DailyBackupScheduler(
            BackblazeBackupStorageService backblazeBackupStorageService,
            CloudBackupService cloudBackupService,
            @Value("${app.backup.schedule.enabled:true}") boolean enabled,
            @Value("${app.backup.schedule.zone:Asia/Ho_Chi_Minh}") String scheduleZone,
            @Value("${app.backup.schedule.retention-days:30}") int retentionDays) {
        this.backblazeBackupStorageService = backblazeBackupStorageService;
        this.cloudBackupService = cloudBackupService;
        this.enabled = enabled;
        this.scheduleZone = scheduleZone;
        this.retentionDays = retentionDays;
    }

    @Scheduled(
        cron = "${app.backup.schedule.cron}",
        zone = "${app.backup.schedule.zone}"
    )
    public void createDailyBackup() {
        if (!enabled) {
            return;
        }
        if (!backblazeBackupStorageService.isConfigured()) {
            log.info("Tự động sao lưu được bỏ qua vì Backblaze B2 chưa được cấu hình đầy đủ.");
            return;
        }
        if (!backupInProgress.compareAndSet(false, true)) {
            log.info("Tự động sao lưu được bỏ qua vì một tác vụ backup trước đó vẫn đang chạy.");
            return;
        }

        Instant startedAt = Instant.now();
        String backupKey = null;
        try {
            String timestamp = LocalDateTime.now(ZoneId.of(scheduleZone)).format(FILE_TIMESTAMP);
            String baseFilename = "backup_auto_" + timestamp;
            backupKey = AUTOMATIC_BACKUP_PREFIX + timestamp + ".zip";
            log.info("Bắt đầu tự động sao lưu lúc {}: {}", startedAt, backupKey);

            BackblazeBackupStorageService.BackupMetadata metadata =
                cloudBackupService.createCloudBackup(baseFilename);
            log.info(
                "Tự động sao lưu thành công: {} ({} bytes)",
                metadata.key(),
                metadata.size()
            );

            if (retentionDays > 0) {
                cleanupExpiredAutomaticBackups();
            }
        } catch (Exception exception) {
            log.error("Tự động sao lưu thất bại cho file {}: {}", backupKey, exception.getMessage(), exception);
        } finally {
            backupInProgress.set(false);
        }
    }

    private void cleanupExpiredAutomaticBackups() {
        Instant cutoff = Instant.now().minus(retentionDays, ChronoUnit.DAYS);
        int deletedCount = 0;

        for (BackblazeBackupStorageService.BackupMetadata backup
                : backblazeBackupStorageService.listBackups()) {
            String key = backup.key();
            if (key.startsWith(AUTOMATIC_BACKUP_PREFIX)
                    && key.endsWith(".zip")
                    && backup.lastModified() != null
                    && backup.lastModified().isBefore(cutoff)) {
                backblazeBackupStorageService.deleteBackup(key);
                deletedCount++;
                log.info("Đã xóa bản tự động sao lưu quá hạn: {}", key);
            }
        }

        log.info(
            "Hoàn tất retention tự động sao lưu: đã xóa {} file cũ hơn {} ngày.",
            deletedCount,
            retentionDays
        );
    }
}
