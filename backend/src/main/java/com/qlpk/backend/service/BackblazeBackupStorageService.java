package com.qlpk.backend.service;

import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.checksums.RequestChecksumCalculation;
import software.amazon.awssdk.core.checksums.ResponseChecksumValidation;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Object;

import java.io.IOException;
import java.io.OutputStream;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class BackblazeBackupStorageService {

    private static final String BACKUP_PREFIX = "backups/";

    private final String endpoint;
    private final String region;
    private final String bucket;
    private final String keyId;
    private final String applicationKey;

    private volatile S3Client s3Client;

    public BackblazeBackupStorageService(
            @Value("${app.backup.b2.endpoint:}") String endpoint,
            @Value("${app.backup.b2.region:us-west-004}") String region,
            @Value("${app.backup.b2.bucket:}") String bucket,
            @Value("${app.backup.b2.key-id:}") String keyId,
            @Value("${app.backup.b2.application-key:}") String applicationKey) {
        this.endpoint = endpoint;
        this.region = region;
        this.bucket = bucket;
        this.keyId = keyId;
        this.applicationKey = applicationKey;
    }

    public record BackupMetadata(String filename, String key, long size, Instant lastModified) {
    }

    public void checkConfiguration() {
        getS3Client();
    }

    public boolean isConfigured() {
        return !isBlank(endpoint)
            && !isBlank(bucket)
            && !isBlank(keyId)
            && !isBlank(applicationKey);
    }

    public BackupMetadata uploadBackup(Path file, String key) throws IOException {
        validateKey(key);
        S3Client client = getS3Client();
        client.putObject(
            PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType("application/zip")
                .build(),
            RequestBody.fromFile(file)
        );
        return getBackupMetadata(key);
    }

    public List<BackupMetadata> listBackups() {
        S3Client client = getS3Client();
        List<BackupMetadata> backups = new ArrayList<>();
        String continuationToken = null;
        boolean hasMore;

        do {
            ListObjectsV2Request.Builder requestBuilder = ListObjectsV2Request.builder()
                .bucket(bucket)
                .prefix(BACKUP_PREFIX);
            if (continuationToken != null) {
                requestBuilder.continuationToken(continuationToken);
            }

            ListObjectsV2Response response = client.listObjectsV2(requestBuilder.build());
            for (S3Object object : response.contents()) {
                if (isValidKey(object.key())) {
                    backups.add(toMetadata(object.key(), object.size(), object.lastModified()));
                }
            }
            continuationToken = response.nextContinuationToken();
            hasMore = Boolean.TRUE.equals(response.isTruncated()) && continuationToken != null;
        } while (hasMore);

        backups.sort(Comparator.comparing(
            BackupMetadata::lastModified,
            Comparator.nullsLast(Comparator.reverseOrder())
        ));
        return backups;
    }

    public BackupMetadata getBackupMetadata(String key) {
        validateKey(key);
        HeadObjectResponse response = getS3Client().headObject(
            HeadObjectRequest.builder().bucket(bucket).key(key).build()
        );
        return toMetadata(key, response.contentLength(), response.lastModified());
    }

    public void downloadTo(String key, OutputStream output) throws IOException {
        validateKey(key);
        try (ResponseInputStream<GetObjectResponse> input = getS3Client().getObject(
                GetObjectRequest.builder().bucket(bucket).key(key).build())) {
            input.transferTo(output);
        }
    }

    public void downloadToFile(String key, Path destination) throws IOException {
        validateKey(key);
        try (ResponseInputStream<GetObjectResponse> input = getS3Client().getObject(
                    GetObjectRequest.builder().bucket(bucket).key(key).build());
             OutputStream output = Files.newOutputStream(destination)) {
            input.transferTo(output);
        }
    }

    public void deleteBackup(String key) {
        validateKey(key);
        getS3Client().deleteObject(
            DeleteObjectRequest.builder().bucket(bucket).key(key).build()
        );
    }

    public void validateKey(String key) {
        if (!isValidKey(key)) {
            throw new IllegalArgumentException("Key backup cloud không hợp lệ.");
        }
    }

    private boolean isValidKey(String key) {
        return key != null
            && key.startsWith(BACKUP_PREFIX)
            && key.endsWith(".zip")
            && !key.contains("..")
            && !key.contains("\\")
            && key.length() > BACKUP_PREFIX.length() + ".zip".length();
    }

    @PreDestroy
    public void close() {
        S3Client client = s3Client;
        if (client != null) {
            client.close();
        }
    }

    private BackupMetadata toMetadata(String key, Long size, Instant lastModified) {
        return new BackupMetadata(
            key.substring(key.lastIndexOf('/') + 1),
            key,
            size == null ? 0L : size,
            lastModified
        );
    }

    private S3Client getS3Client() {
        S3Client client = s3Client;
        if (client != null) {
            return client;
        }

        synchronized (this) {
            if (s3Client == null) {
                s3Client = createS3Client();
            }
            return s3Client;
        }
    }

    private S3Client createS3Client() {
        List<String> missing = new ArrayList<>();
        if (isBlank(endpoint)) missing.add("B2_ENDPOINT");
        if (isBlank(region)) missing.add("B2_REGION");
        if (isBlank(bucket)) missing.add("B2_BUCKET");
        if (isBlank(keyId)) missing.add("B2_KEY_ID");
        if (isBlank(applicationKey)) missing.add("B2_APPLICATION_KEY");
        if (!missing.isEmpty()) {
            throw new StorageNotConfiguredException(
                "Backblaze B2 chưa được cấu hình đầy đủ. Thiếu: " + String.join(", ", missing)
            );
        }

        URI endpointUri;
        try {
            endpointUri = URI.create(endpoint.trim());
        } catch (IllegalArgumentException exception) {
            throw new StorageNotConfiguredException("B2_ENDPOINT không phải URI hợp lệ.", exception);
        }
        if (endpointUri.getHost() == null
                || !("https".equalsIgnoreCase(endpointUri.getScheme())
                    || "http".equalsIgnoreCase(endpointUri.getScheme()))) {
            throw new StorageNotConfiguredException(
                "B2_ENDPOINT phải là URL http(s), ví dụ https://s3.us-west-004.backblazeb2.com."
            );
        }

        return S3Client.builder()
            .endpointOverride(endpointUri)
            .region(Region.of(region.trim()))
            .credentialsProvider(StaticCredentialsProvider.create(
                AwsBasicCredentials.create(keyId, applicationKey)
            ))
            .httpClientBuilder(UrlConnectionHttpClient.builder())
            .requestChecksumCalculation(RequestChecksumCalculation.WHEN_REQUIRED)
            .responseChecksumValidation(ResponseChecksumValidation.WHEN_REQUIRED)
            .forcePathStyle(true)
            .build();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    public static class StorageNotConfiguredException extends RuntimeException {
        public StorageNotConfiguredException(String message) {
            super(message);
        }

        public StorageNotConfiguredException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
