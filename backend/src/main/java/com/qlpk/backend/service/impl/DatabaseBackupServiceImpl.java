package com.qlpk.backend.service.impl;

import com.qlpk.backend.service.AivenBackupService;
import com.qlpk.backend.service.DatabaseBackupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class DatabaseBackupServiceImpl implements DatabaseBackupService {

    @Autowired
    private AivenBackupService aivenBackupService;

    @Override
    public Map<String, Object> getDatabaseInfo() {
        return aivenBackupService.getServiceInfo();
    }

    @Override
    public Map<String, Object> getBackups() {
        try {
            return aivenBackupService.getBackups();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi lấy danh sách backup: " + e.getMessage(), e);
        }
    }

    @Override
    public Map<String, Object> createBackup() {
        try {
            return aivenBackupService.createBackup();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi tạo backup: " + e.getMessage(), e);
        }
    }

    @Override
    public Map<String, Object> restoreFromBackup(String filename) {
        try {
            return aivenBackupService.restoreFromBackup(filename);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi phục hồi: " + e.getMessage(), e);
        }
    }
}
