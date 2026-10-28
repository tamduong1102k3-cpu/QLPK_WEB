package com.qlpk.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class EmailService {

    @Value("${brevo.api.url}")
    private String brevoApiUrl;

    @Value("${brevo.api.key}")
    private String brevoApiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public EmailService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Gửi email qua Brevo Transactional Email API
     * Email gửi từ địa chỉ đã được verify trong Brevo
     */
    public boolean sendEmail(String toEmail, String subject, String body) {
        try {
            // Chuẩn bị headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
            headers.set("api-key", brevoApiKey);

            // Chuẩn bị request body
            Map<String, Object> requestBody = new HashMap<>();

            // Sender
            Map<String, String> sender = new HashMap<>();
            sender.put("name", "PHÒNG KHÁM");
            sender.put("email", "duongvanminhtam30@gmail.com");
            requestBody.put("sender", sender);

            // To
            List<Map<String, String>> toList = new ArrayList<>();
            Map<String, String> to = new HashMap<>();
            to.put("email", toEmail);
            to.put("name", toEmail);
            toList.add(to);
            requestBody.put("to", toList);

            // Subject & content
            requestBody.put("subject", subject);
            requestBody.put("htmlContent", body);

            // Convert request body to JSON string
            String jsonBody = objectMapper.writeValueAsString(requestBody);

            System.out.println("Preparing to send email via Brevo API...");
            System.out.println("To: " + toEmail + ", Subject: " + subject);

            // Tạo HTTP entity
            HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

            // Gửi request
            ResponseEntity<String> response = restTemplate.exchange(
                    brevoApiUrl,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            System.out.println("Brevo API response status: " + response.getStatusCode());
            System.out.println("Brevo API response body: " + response.getBody());

            if (response.getStatusCode().is2xxSuccessful()) {
                System.out.println("Email sent successfully via Brevo API to " + toEmail);
                return true;
            } else {
                System.err.println("Brevo API returned error: " + response.getStatusCode() + " - " + response.getBody());
                return false;
            }
        } catch (Exception e) {
            System.err.println("Brevo API error: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
}