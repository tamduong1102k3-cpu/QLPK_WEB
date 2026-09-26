package com.qlpk.backend.service;

import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;

@Service
public class DatabaseRoutingService {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseRoutingService.class);

    private final DataSource dataSource;

    public DatabaseRoutingService(DataSource dataSource) {
        this.dataSource = dataSource;
        logger.info("DatabaseRoutingService initialized with DataSource type: {}", dataSource.getClass().getName());
    }

    public void updateDatabaseConnection(String newHost, String newPort, String newPassword) {
        logger.info("=== updateDatabaseConnection ===");
        logger.info("New host: {}, port: {}, password length: {}", newHost, newPort, newPassword != null ? newPassword.length() : 0);

        if (dataSource instanceof HikariDataSource) {
            HikariDataSource hikariDataSource = (HikariDataSource) dataSource;

            logger.info("🔄 Đang ngắt kết nối cũ, chuyển sang Database mới từ Aiven...");

            String newJdbcUrl = String.format(
                "jdbc:mysql://%s:%s/dbphongkham8?useSSL=true&trustServerCertificate=true&allowPublicKeyRetrieval=true&serverTimezone=UTC",
                newHost, newPort
            );
            hikariDataSource.setJdbcUrl(newJdbcUrl);
            hikariDataSource.setPassword(newPassword);

            try {
                if (hikariDataSource.getHikariPoolMXBean() != null) {
                    hikariDataSource.getHikariPoolMXBean().softEvictConnections();
                    logger.info("Đã soft-evict các kết nối cũ");
                }
            } catch (Exception e) {
                logger.warn("Không thể soft-evict connections (có thể pool chưa khởi tạo): {}", e.getMessage());
            }

            logger.info("✅ Hệ thống đã tự động chuyển kết nối sang DB mới: {}", newJdbcUrl);
        } else {
            String error = "DataSource không phải là HikariDataSource, không thể cập nhật động! Type: " + dataSource.getClass().getName();
            logger.error(error);
            throw new IllegalStateException(error);
        }
    }
}
