package com.qlpk.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.sql.DataSource;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.sql.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Pattern;

@Service
public class AivenBackupService {

    private static final Logger logger = LoggerFactory.getLogger(AivenBackupService.class);
    private static final String AIVEN_API_BASE = "https://api.aiven.io/v1";
    private static final DateTimeFormatter BACKUP_NAME_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");
    private static final Pattern SAFE_FILENAME_PATTERN = Pattern.compile("^[a-zA-Z0-9._-]+\\.sql$");

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private DataSource dataSource;

    @Autowired
    private DatabaseRoutingService databaseRoutingService;

    @Value("${aiven.api.token}")
    private String aivenApiToken;

    @Value("${aiven.project.name}")
    private String projectName;

    @Value("${aiven.service.name}")
    private String serviceName;

    @Value("${backup.directory:./backups}")
    private String backupDirectory;

    private Path backupDir;

    private HttpEntity<String> createAuthEntity() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + aivenApiToken);
        return new HttpEntity<>(headers);
    }

    public Map<String, Object> createBackup() throws Exception {
        logger.info("=== BẮT ĐẦU BACKUP QUA JDBC ===");

        backupDir = Paths.get(backupDirectory).toAbsolutePath().normalize();
        Files.createDirectories(backupDir);

        String filename = "backup_aiven_" + LocalDateTime.now().format(BACKUP_NAME_FORMAT) + ".sql";
        Path outputFile = backupDir.resolve(filename);

        StringBuilder sql = new StringBuilder();
        sql.append("-- ============================================\n");
        sql.append("-- Backup from Aiven MySQL via JDBC\n");
        sql.append("-- Created: ").append(LocalDateTime.now()).append("\n");
        sql.append("-- ============================================\n\n");
        sql.append("SET FOREIGN_KEY_CHECKS = 0;\n\n");

        try (Connection conn = dataSource.getConnection()) {
            DatabaseMetaData meta = conn.getMetaData();
            String databaseName = conn.getCatalog();

            List<String> tables = new ArrayList<>();
            try (ResultSet rs = meta.getTables(databaseName, null, "%", new String[]{"TABLE"})) {
                while (rs.next()) {
                    String tableName = rs.getString("TABLE_NAME");
                    tables.add(tableName);
                }
            }

            logger.info("Tìm thấy {} tables trong database {}", tables.size(), databaseName);

            for (String table : tables) {
                logger.info("Đang backup table: {}", table);
                sql.append("-- Table: ").append(table).append("\n");
                sql.append("DROP TABLE IF EXISTS `").append(table).append("`;\n");
                sql.append("CREATE TABLE `").append(table).append("` (\n");

                List<ColumnInfo> columns = new ArrayList<>();
                try (ResultSet rs = meta.getColumns(databaseName, null, table, null)) {
                    while (rs.next()) {
                        ColumnInfo col = new ColumnInfo();
                        col.name = rs.getString("COLUMN_NAME");
                        col.type = rs.getString("TYPE_NAME");
                        col.size = rs.getInt("COLUMN_SIZE");
                        col.isNullable = rs.getInt("NULLABLE") == DatabaseMetaData.columnNullable;
                        col.isAutoIncrement = rs.getString("IS_AUTOINCREMENT") != null && "YES".equals(rs.getString("IS_AUTOINCREMENT"));
                        col.defaultValue = rs.getString("COLUMN_DEF");
                        columns.add(col);
                    }
                }

                for (int i = 0; i < columns.size(); i++) {
                    ColumnInfo col = columns.get(i);
                    sql.append("  `").append(col.name).append("` ").append(col.type);
                    if (col.size > 0 && !col.type.equalsIgnoreCase("TEXT")
                            && !col.type.equalsIgnoreCase("BLOB")
                            && !col.type.equalsIgnoreCase("JSON")) {
                        sql.append("(").append(col.size).append(")");
                    }
                    if (!col.isNullable) {
                        sql.append(" NOT NULL");
                    }
                    if (col.isAutoIncrement) {
                        sql.append(" AUTO_INCREMENT");
                    }
                    if (col.defaultValue != null) {
                        sql.append(" DEFAULT ").append(col.defaultValue);
                    }
                    if (i < columns.size() - 1) {
                        sql.append(",");
                    }
                    sql.append("\n");
                }

                List<String> primaryKeys = new ArrayList<>();
                try (ResultSet rs = meta.getPrimaryKeys(databaseName, null, table)) {
                    while (rs.next()) {
                        primaryKeys.add(rs.getString("COLUMN_NAME"));
                    }
                }
                if (!primaryKeys.isEmpty()) {
                    sql.append("  PRIMARY KEY (`").append(String.join("`,`", primaryKeys)).append("`)\n");
                }

                sql.append(") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n");

                sql.append("-- Data for table `").append(table).append("`\n");
                long rowCount = exportTableData(conn, table, columns, sql);
                logger.info("  Exported {} rows", rowCount);
                sql.append("\n");
            }

            sql.append("SET FOREIGN_KEY_CHECKS = 1;\n");
            sql.append("-- ============================================\n");
            sql.append("-- Backup completed\n");
            sql.append("-- ============================================\n");
        }

        Files.writeString(outputFile, sql.toString(), StandardCharsets.UTF_8);
        long fileSize = Files.size(outputFile);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Backup database thành công!");
        result.put("filename", filename);
        result.put("size", fileSize);
        result.put("createdAt", LocalDateTime.now().toString());
        result.put("backupDirectory", backupDir.toString());

        logger.info("=== KẾT THÚC BACKUP - File: {} ({} bytes) ===", filename, fileSize);
        return result;
    }

    private long exportTableData(Connection conn, String table, List<ColumnInfo> columns, StringBuilder sql) throws SQLException {
        long rowCount = 0;
        StringBuilder batchInsert = new StringBuilder();

        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT * FROM `" + table + "`")) {

            while (rs.next()) {
                rowCount++;
                if (batchInsert.length() == 0) {
                    batchInsert.append("INSERT INTO `").append(table).append("` VALUES\n");
                }

                batchInsert.append("(");
                for (int i = 0; i < columns.size(); i++) {
                    if (i > 0) batchInsert.append(",");

                    Object value = rs.getObject(i + 1);
                    if (value == null) {
                        batchInsert.append("NULL");
                    } else if (value instanceof Number) {
                        batchInsert.append(value);
                    } else if (value instanceof Boolean) {
                        batchInsert.append((Boolean) value ? "1" : "0");
                    } else {
                        String str = value.toString();

                        str = str.replace("\\", "\\\\")
                                 .replace("'", "\\'")
                                 .replace("\n", "\\n")
                                 .replace("\r", "\\r");
                        batchInsert.append("'").append(str).append("'");
                    }
                }
                batchInsert.append(")");

                if (rowCount % 100 == 0) {
                    batchInsert.append(";\n");
                    sql.append(batchInsert);
                    batchInsert.setLength(0);
                } else {
                    batchInsert.append(",\n");
                }
            }

            if (batchInsert.length() > 0) {

                int lastComma = batchInsert.lastIndexOf(",");
                if (lastComma > 0) {
                    batchInsert.setCharAt(lastComma, ';');
                    batchInsert.setLength(lastComma + 1);
                }
                sql.append(batchInsert).append("\n");
            }
        }

        return rowCount;
    }

    public Map<String, Object> restoreFromBackup(String filename) throws Exception {
        logger.info("=== BẮT ĐẦU RESTORE từ file: {} ===", filename);

        backupDir = Paths.get(backupDirectory).toAbsolutePath().normalize();
        Path backupFile = backupDir.resolve(filename).normalize();

        if (!backupFile.startsWith(backupDir)) {
            throw new RuntimeException("Tên file không hợp lệ");
        }
        if (!Files.exists(backupFile)) {
            throw new RuntimeException("Không tìm thấy file backup: " + filename);
        }

        String content = Files.readString(backupFile, StandardCharsets.UTF_8);

        content = content.replace("\r\n", "\n").replace("\r", "\n");

        StringBuilder cleanContent = new StringBuilder();
        for (String line : content.split("\n", -1)) {
            String trimmedLine = line.trim();
            if (trimmedLine.startsWith("--") || trimmedLine.startsWith("#") || trimmedLine.startsWith("/*") || trimmedLine.startsWith("*")) {

                continue;
            }
            cleanContent.append(line).append("\n");
        }
        String cleaned = cleanContent.toString();

        String[] statements = cleaned.split(";\n");

        int totalExecuted = 0;
        int totalErrors = 0;
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {

            stmt.execute("SET FOREIGN_KEY_CHECKS = 0");

            for (String statement : statements) {
                String sql = statement.trim();
                if (sql.isEmpty()) {
                    continue;
                }
                try {
                    stmt.execute(sql);
                    totalExecuted++;
                } catch (SQLException e) {
                    totalErrors++;
                    logger.warn("SQL execute failed (ignoring): {} - {}", sql.substring(0, Math.min(80, sql.length())), e.getMessage());
                }
            }

            stmt.execute("SET FOREIGN_KEY_CHECKS = 1");
        }

        Map<String, Object> result = new HashMap<>();
        String message;
        if (totalErrors == 0) {
            message = "Phục hồi database thành công! Đã thực thi " + totalExecuted + " câu lệnh SQL.";
        } else {
            message = "Phục hồi database hoàn tất. " + totalExecuted + " câu lệnh thành công, " + totalErrors + " lỗi (đã bỏ qua).";
        }
        result.put("success", true);
        result.put("message", message);
        result.put("executedStatements", totalExecuted);
        result.put("errorStatements", totalErrors);
        logger.info("=== KẾT THÚC RESTORE - {} statements executed, {} errors ===", totalExecuted, totalErrors);
        return result;
    }

    public Map<String, Object> getBackups() throws Exception {
        String url = String.format("%s/project/%s/service/%s/backups", AIVEN_API_BASE, projectName, serviceName);
        logger.info("Aiven API: GET {}", url);

        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, createAuthEntity(), String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode json = objectMapper.readTree(response.getBody());
                JsonNode backupsNode = json.has("backups") ? json.get("backups") : null;

                List<Map<String, Object>> backupList = new ArrayList<>();
                if (backupsNode != null && backupsNode.isArray()) {
                    for (JsonNode b : backupsNode) {
                        Map<String, Object> item = new HashMap<>();

                        String backupId = b.has("backup_id") ? b.get("backup_id").asText() : null;
                        if (backupId == null || backupId.isEmpty()) {
                            backupId = b.has("backup_location") ? b.get("backup_location").asText() : null;
                        }
                        if (backupId == null || backupId.isEmpty()) {
                            backupId = "Backup " + (backupList.size() + 1);
                        }
                        item.put("backup_id", backupId);
                        item.put("data_size", b.has("data_size") ? b.get("data_size").asLong() : 0);
                        item.put("start_time", b.has("start_time") ? b.get("start_time").asText() : "");
                        item.put("state", b.has("state") ? b.get("state").asText() : "available");
                        item.put("backup_location", b.has("backup_location") ? b.get("backup_location").asText() : "");

                        item.put("canRestore", false);
                        backupList.add(item);
                    }
                }

                Map<String, Object> result = new HashMap<>();
                result.put("success", true);
                result.put("backups", backupList);
                logger.info("Lấy {} backups từ Aiven cloud thành công", backupList.size());
                return result;
            }
            throw new RuntimeException("Aiven API error: " + response.getStatusCode() + " - " + response.getBody());
        } catch (Exception e) {
            logger.error("Lỗi lấy backup từ Aiven cloud", e);

            logger.info("Fallback: lấy từ local backup directory");
            backupDir = Paths.get(backupDirectory).toAbsolutePath().normalize();
            Files.createDirectories(backupDir);

            List<Map<String, Object>> backupList = new ArrayList<>();
            try (var files = Files.list(backupDir)) {
                files.filter(f -> f.getFileName().toString().endsWith(".sql"))
                     .sorted(Comparator.comparing(f -> {
                         try { return Files.getLastModifiedTime(f); }
                         catch (IOException e2) { return null; }
                     }, Comparator.nullsLast(Comparator.reverseOrder())))
                     .forEach(f -> {
                         try {
                             Map<String, Object> item = new HashMap<>();
                             item.put("backup_id", f.getFileName().toString());
                             item.put("data_size", Files.size(f));
                             item.put("start_time", Files.getLastModifiedTime(f).toInstant().toString());
                             item.put("state", "available");

                             item.put("canRestore", true);
                             backupList.add(item);
                         } catch (IOException ignored) {}
                     });
            }

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("backups", backupList);
            logger.info("Fallback: tìm thấy {} local backup files", backupList.size());
            return result;
        }
    }

    public Map<String, Object> getServiceInfo() {
        String url = String.format("%s/project/%s/service/%s", AIVEN_API_BASE, projectName, serviceName);
        logger.info("Aiven API: GET {}", url);

        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, createAuthEntity(), String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode json = objectMapper.readTree(response.getBody());
                JsonNode service = json.get("service");

                Map<String, Object> info = new HashMap<>();
                info.put("serviceName", service.has("service_name") ? service.get("service_name").asText() : serviceName);
                info.put("serviceType", service.has("service_type") ? service.get("service_type").asText() : "");
                info.put("plan", service.has("plan") ? service.get("plan").asText() : "");
                info.put("state", service.has("state") ? service.get("state").asText() : "");
                if (service.has("features") && service.get("features").has("backup")) {
                    info.put("backupHour", service.get("features").get("backup").get("backup_hour").asInt());
                }

                try (Connection conn = dataSource.getConnection()) {
                    String databaseName = conn.getCatalog();
                    info.put("databaseName", databaseName != null ? databaseName : "dbphongkham8");
                } catch (SQLException e) {
                    logger.warn("Không thể lấy tên database từ JDBC: {}", e.getMessage());
                    info.put("databaseName", "dbphongkham8");
                }
                return info;
            }
            throw new RuntimeException("Aiven API error: " + response.getStatusCode());
        } catch (Exception e) {
            logger.error("Lỗi lấy thông tin service từ Aiven", e);
            throw new RuntimeException("Lỗi khi lấy thông tin service: " + e.getMessage(), e);
        }
    }

    static class ColumnInfo {
        String name;
        String type;
        int size;
        boolean isNullable;
        boolean isAutoIncrement;
        String defaultValue;
    }
}
