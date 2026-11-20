package com.qlpk.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.EOFException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.zip.ZipEntry;
import java.util.zip.ZipException;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

@Service
public class DatabaseBackupService {

    private static final Logger log = LoggerFactory.getLogger(DatabaseBackupService.class);
    private static final String RESTORE_SESSION_HEADER = """
        SET FOREIGN_KEY_CHECKS=0;
        SET UNIQUE_CHECKS=0;
        SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT;
        SET AUTOCOMMIT=0;
        """;
    private static final String RESTORE_SESSION_FOOTER = """
        COMMIT;
        SET FOREIGN_KEY_CHECKS=1;
        SET UNIQUE_CHECKS=1;
        SET AUTOCOMMIT=1;
        """;

    private final String datasourceUrl;
    private final String datasourceUsername;
    private final String datasourcePassword;
    private final long maxUncompressedSize;

    public DatabaseBackupService(
            @Value("${spring.datasource.url}") String datasourceUrl,
            @Value("${spring.datasource.username}") String datasourceUsername,
            @Value("${spring.datasource.password}") String datasourcePassword,
            @Value("${app.backup.max-uncompressed-size:209715200}") long maxUncompressedSize) {
        if (maxUncompressedSize <= 0) {
            throw new IllegalArgumentException("app.backup.max-uncompressed-size must be positive");
        }
        this.datasourceUrl = datasourceUrl;
        this.datasourceUsername = datasourceUsername;
        this.datasourcePassword = datasourcePassword;
        this.maxUncompressedSize = maxUncompressedSize;
    }

    public void writeBackupTo(OutputStream outputStream, String sqlEntryName) throws IOException {
        DatabaseConnection connection = parseConnection(datasourceUrl);

        List<String> command = new ArrayList<>();
        command.add("mariadb-dump");
        command.add("--host=" + connection.host());
        command.add("--port=" + connection.port());
        command.add("--protocol=TCP");
        command.add("--user=" + datasourceUsername);
        command.add("--no-tablespaces");
        command.add("--skip-comments");
        command.add("--compact");
        command.add("--add-drop-table");
        command.add("--skip-add-locks");
        command.add("--skip-disable-keys");
        command.add("--skip-lock-tables");
        command.add("--quick");
        command.add("--databases");
        command.add(connection.database());

        ProcessBuilder processBuilder = new ProcessBuilder(command);
        processBuilder.environment().put("MYSQL_PWD", datasourcePassword);

        Path temporaryFile = Files.createTempFile("qlpk-backup-", ".sql");
        Path errorFile = null;
        try {
            errorFile = Files.createTempFile("qlpk-backup-", ".err");
            processBuilder.redirectOutput(temporaryFile.toFile());
            processBuilder.redirectError(errorFile.toFile());
            Process process = processBuilder.start();
            try {
                int exitCode = process.waitFor();
                if (exitCode != 0) {
                    String dumpError = Files.readString(errorFile, StandardCharsets.UTF_8).trim();
                    log.error("mariadb-dump exited with code {}: {}", exitCode, dumpError);
                    throw new IOException("mariadb-dump exited with code " + exitCode
                        + (dumpError.isEmpty() ? "" : ": " + dumpError));
                }
            } catch (InterruptedException exception) {
                process.destroyForcibly();
                Thread.currentThread().interrupt();
                throw new IOException("Database backup was interrupted", exception);
            }

            long tableCount;
            try (var lines = Files.lines(temporaryFile, StandardCharsets.UTF_8)) {
                tableCount = lines.filter(line -> line.contains("CREATE TABLE")).count();
            }
            log.info("Số bảng đã dump được: {}", tableCount);
            if (tableCount < 5) {
                log.warn("CẢNH BÁO: File backup chỉ có {} bảng, có thể bị lỗi giữa chừng!", tableCount);
            }

            try (ZipOutputStream zipOutputStream = new ZipOutputStream(outputStream, StandardCharsets.UTF_8);
                 InputStream dumpStream = Files.newInputStream(temporaryFile)) {
                zipOutputStream.putNextEntry(new ZipEntry(sqlEntryName));
                copySqlWithoutMariaDbIncompatibleLines(dumpStream, zipOutputStream);
                zipOutputStream.closeEntry();
            }
        } finally {
            Files.deleteIfExists(temporaryFile);
            if (errorFile != null) {
                Files.deleteIfExists(errorFile);
            }
        }
    }

    public void writeBackupTo(Path zipFile, String sqlEntryName) throws IOException {
        try (OutputStream outputStream = Files.newOutputStream(zipFile)) {
            writeBackupTo(outputStream, sqlEntryName);
        }
    }

    public void restoreDatabase(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn file backup ZIP không rỗng.");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase(Locale.ROOT).endsWith(".zip")) {
            throw new IllegalArgumentException("Chỉ chấp nhận file có định dạng .zip.");
        }

        Path temporaryZipFile = Files.createTempFile("qlpk-restore-", ".zip");
        try {
            try (InputStream uploadStream = file.getInputStream()) {
                Files.copy(uploadStream, temporaryZipFile, StandardCopyOption.REPLACE_EXISTING);
            }
            restoreDatabase(temporaryZipFile);
        } finally {
            Files.deleteIfExists(temporaryZipFile);
        }
    }

    public void restoreDatabase(Path zipFile) throws IOException {
        if (zipFile == null || !Files.isRegularFile(zipFile) || Files.size(zipFile) == 0) {
            throw new IllegalArgumentException("Vui lòng chọn file backup ZIP không rỗng.");
        }
        Path filenamePath = zipFile.getFileName();
        if (filenamePath == null || !filenamePath.toString().toLowerCase(Locale.ROOT).endsWith(".zip")) {
            throw new IllegalArgumentException("Chỉ chấp nhận file có định dạng .zip.");
        }

        DatabaseConnection connection = parseConnection(datasourceUrl);
        Path temporaryDirectory = null;
        Path temporarySqlFile = null;
        Path restoreSqlFile = null;
        Process process = null;
        try {
            temporaryDirectory = Files.createTempDirectory("qlpk-restore-");
            temporarySqlFile = temporaryDirectory.resolve("restore.sql");
            extractSqlFromZip(zipFile, temporaryDirectory, temporarySqlFile);

            try (BufferedReader reader = Files.newBufferedReader(temporarySqlFile, StandardCharsets.UTF_8)) {
                String firstLine = reader.readLine();
                if (firstLine != null && firstLine.contains("/*M!")) {
                    throw new IllegalArgumentException(
                        "File backup không tương thích (chứa cú pháp MariaDB). Vui lòng backup lại.");
                }
            }

            restoreSqlFile = temporaryDirectory.resolve("restore-with-session.sql");
            writeRestoreSql(temporarySqlFile, restoreSqlFile);

            List<String> command = new ArrayList<>();
            command.add("mysql");
            command.add("--host=" + connection.host());
            command.add("--port=" + connection.port());
            command.add("--protocol=TCP");
            command.add("--user=" + datasourceUsername);
            command.add("--database=" + connection.database());

            ProcessBuilder processBuilder = new ProcessBuilder(command)
                .redirectInput(restoreSqlFile.toFile())
                .redirectErrorStream(true);
            processBuilder.environment().put("MYSQL_PWD", datasourcePassword);

            process = processBuilder.start();
            String processOutput;
            try (InputStream outputStream = process.getInputStream()) {
                processOutput = readProcessOutputAsString(outputStream);
            }

            int exitCode = process.waitFor();
            log.info("MySQL restore process exited with code {}", exitCode);
            log.info("MySQL restore output: {}", processOutput);
            if (exitCode != 0 || processOutput.toUpperCase(Locale.ROOT).contains("ERROR")) {
                throw new IOException("Lỗi khi Restore: " + processOutput);
            }
        } catch (InterruptedException exception) {
            destroyProcess(process);
            Thread.currentThread().interrupt();
            throw new IOException("Database restore was interrupted", exception);
        } catch (IOException exception) {
            destroyProcess(process);
            throw exception;
        } finally {
            try {
                if (restoreSqlFile != null) {
                    Files.deleteIfExists(restoreSqlFile);
                }
            } finally {
                try {
                    if (temporarySqlFile != null) {
                        Files.deleteIfExists(temporarySqlFile);
                    }
                } finally {
                    if (temporaryDirectory != null) {
                        Files.deleteIfExists(temporaryDirectory);
                    }
                }
            }
        }
    }

    private void writeRestoreSql(Path sourceSqlFile, Path restoreSqlFile) throws IOException {
        try (OutputStream output = Files.newOutputStream(restoreSqlFile)) {
            output.write(RESTORE_SESSION_HEADER.getBytes(StandardCharsets.UTF_8));
            Files.copy(sourceSqlFile, output);
            output.write('\n');
            output.write(RESTORE_SESSION_FOOTER.getBytes(StandardCharsets.UTF_8));
        }
    }

    private void extractSqlFromZip(Path zipFile, Path temporaryDirectory, Path sqlFile) throws IOException {
        Path normalizedTemporaryDirectory = temporaryDirectory.toAbsolutePath().normalize();
        long totalUncompressedSize = 0;
        boolean foundSqlFile = false;
        byte[] buffer = new byte[8192];

        try (ZipInputStream zipInputStream = new ZipInputStream(
                Files.newInputStream(zipFile), StandardCharsets.UTF_8)) {
            try {
                ZipEntry entry;
                while ((entry = zipInputStream.getNextEntry()) != null) {
                    Path entryPath = validateZipEntryPath(entry.getName(), normalizedTemporaryDirectory);
                    boolean macOsMetadata = entryPath.startsWith(normalizedTemporaryDirectory.resolve("__MACOSX"));
                    boolean sqlEntry = !entry.isDirectory()
                        && !macOsMetadata
                        && entryPath.getFileName().toString().toLowerCase(Locale.ROOT).endsWith(".sql");

                    if (sqlEntry && foundSqlFile) {
                        throw new IllegalArgumentException("File ZIP chỉ được chứa một file .sql.");
                    }

                    OutputStream entryOutput = OutputStream.nullOutputStream();
                    if (sqlEntry) {
                        foundSqlFile = true;
                        entryOutput = Files.newOutputStream(sqlFile);
                    }

                    try (OutputStream output = entryOutput) {
                        while (true) {
                            int bytesRead = readZipEntry(zipInputStream, buffer, totalUncompressedSize);
                            if (bytesRead < 0) {
                                break;
                            }
                            totalUncompressedSize += bytesRead;
                            output.write(buffer, 0, bytesRead);
                        }
                    }
                    zipInputStream.closeEntry();
                }
            } catch (ZipException | EOFException exception) {
                throw new IllegalArgumentException("File ZIP không hợp lệ hoặc bị hỏng.", exception);
            }
        }

        if (!foundSqlFile || !Files.exists(sqlFile) || Files.size(sqlFile) == 0) {
            throw new IllegalArgumentException("File ZIP phải chứa một file .sql không rỗng.");
        }
    }

    private int readZipEntry(ZipInputStream zipInputStream, byte[] buffer, long totalUncompressedSize)
            throws IOException {
        long remaining = maxUncompressedSize - totalUncompressedSize;
        int readLimit = remaining < buffer.length ? (int) remaining + 1 : buffer.length;
        int bytesRead = zipInputStream.read(buffer, 0, readLimit);

        if (bytesRead > remaining) {
            throw new IllegalArgumentException("Dung lượng giải nén vượt quá giới hạn cho phép.");
        }
        return bytesRead;
    }

    private Path validateZipEntryPath(String entryName, Path temporaryDirectory) {
        if (entryName == null || entryName.isBlank()) {
            throw new IllegalArgumentException("File ZIP chứa tên entry không hợp lệ.");
        }

        String normalizedEntryName = entryName.replace('\\', '/');
        if (normalizedEntryName.startsWith("/") || normalizedEntryName.matches("^[a-zA-Z]:.*")) {
            throw new IllegalArgumentException("File ZIP chứa đường dẫn không an toàn.");
        }

        try {
            Path relativePath = Path.of(normalizedEntryName);
            if (relativePath.isAbsolute()) {
                throw new IllegalArgumentException("File ZIP chứa đường dẫn không an toàn.");
            }
            for (Path segment : relativePath) {
                if ("..".equals(segment.toString())) {
                    throw new IllegalArgumentException("File ZIP chứa đường dẫn không an toàn.");
                }
            }

            Path resolvedPath = temporaryDirectory.resolve(relativePath).normalize();
            if (!resolvedPath.startsWith(temporaryDirectory) || resolvedPath.equals(temporaryDirectory)) {
                throw new IllegalArgumentException("File ZIP chứa đường dẫn không an toàn.");
            }
            return resolvedPath;
        } catch (InvalidPathException exception) {
            throw new IllegalArgumentException("File ZIP chứa đường dẫn không hợp lệ.", exception);
        }
    }

    private String readProcessOutputAsString(InputStream inputStream) throws IOException {
        return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
    }

    static void copySqlWithoutMariaDbIncompatibleLines(InputStream input, OutputStream output)
            throws IOException {
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(input, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.startsWith("/*M!999999")) {
                    continue;
                }
                output.write((line + "\n").getBytes(StandardCharsets.UTF_8));
            }
        }
    }

    private void destroyProcess(Process process) {
        if (process != null && process.isAlive()) {
            process.destroyForcibly();
            try {
                process.waitFor();
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
            }
        }
    }

    private DatabaseConnection parseConnection(String jdbcUrl) throws IOException {
        if (jdbcUrl == null || !jdbcUrl.startsWith("jdbc:mysql://")) {
            throw new IOException("Database operation requires a jdbc:mysql URL");
        }

        try {
            URI uri = new URI(jdbcUrl.substring("jdbc:".length()));
            String host = uri.getHost();
            String path = uri.getPath();
            String database = path == null || path.length() < 2
                ? null
                : path.substring(1);

            if (host == null || database == null || database.isBlank()) {
                throw new IOException("Database host or name is missing from the JDBC URL");
            }

            int port = uri.getPort() < 0 ? 3306 : uri.getPort();
            return new DatabaseConnection(host, port, database);
        } catch (URISyntaxException exception) {
            throw new IOException("Invalid JDBC URL for database backup", exception);
        }
    }

    private record DatabaseConnection(String host, int port, String database) {
    }

}
