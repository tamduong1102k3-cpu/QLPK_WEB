package com.qlpk.backend.service;

import java.util.Map;

public interface DatabaseBackupService {

    Map<String, Object> getDatabaseInfo();

    Map<String, Object> getBackups();

    Map<String, Object> createBackup();

    Map<String, Object> restoreFromBackup(String filename);
}
