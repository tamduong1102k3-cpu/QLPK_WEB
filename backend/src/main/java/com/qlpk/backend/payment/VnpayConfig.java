package com.qlpk.backend.payment;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Configuration
public class VnpayConfig {

    @Value("${vnpay.tmn-code}")
    private String tmnCode;

    @Value("${vnpay.hash-secret}")
    private String hashSecret;

    @Value("${vnpay.pay-url}")
    private String payUrl;

    @Value("${vnpay.return-url}")
    private String returnUrl;

    @Value("${vnpay.tmn-code-pro:}")
    private String tmnCodePro;

    @Value("${vnpay.hash-secret-pro:}")
    private String hashSecretPro;

    public String getTmnCode() { return tmnCode; }
    public String getHashSecret() { return hashSecret; }
    public String getPayUrl() { return payUrl; }
    public String getReturnUrl() { return returnUrl; }

    public String getTmnCodePro() { return tmnCodePro; }
    public String getHashSecretPro() { return hashSecretPro; }

    /**
     * Chọn hash secret theo vnp_TmnCode của request.
     * VNPay return/IPN có thể đến từ 2 merchant (sandbox 1YNCE3P2 hoặc PRO BFU0KS0D),
     * mỗi merchant có hash secret riêng. Nếu tmnCode khớp PRO thì dùng secret PRO,
     * ngược lại dùng secret sandbox (mặc định).
     */
    public String getHashSecretByTmnCode(String tmnCode) {
        if (tmnCode != null && !tmnCode.isEmpty()
                && tmnCodePro != null && !tmnCodePro.isEmpty()
                && tmnCode.equals(tmnCodePro)) {
            return hashSecretPro;
        }
        return hashSecret;
    }

    /**
     * Chọn TmnCode theo Origin của request tạo URL thanh toán.
     * Frontend production (vercel) đã whitelist merchant PRO (BFU0KS0D),
     * localhost dùng merchant sandbox (1YNCE3P2).
     * Nếu tmnCodePro rỗng thì fallback về tmnCode sandbox để không vỡ luồng.
     */
    public String getTmnCodeByOrigin(String origin) {
        if (origin != null && origin.contains("vercel.app")
                && tmnCodePro != null && !tmnCodePro.isEmpty()) {
            return tmnCodePro;
        }
        return tmnCode;
    }

    public String hmacSHA512(final String key, final String data) {
        try {
            if (key == null || data == null) throw new NullPointerException();
            final Mac hmac512 = Mac.getInstance("HmacSHA512");
            byte[] hmacKeyBytes = key.getBytes(StandardCharsets.UTF_8);
            final SecretKeySpec secretKey = new SecretKeySpec(hmacKeyBytes, "HmacSHA512");
            hmac512.init(secretKey);
            byte[] dataBytes = data.getBytes(StandardCharsets.UTF_8);
            byte[] result = hmac512.doFinal(dataBytes);
            StringBuilder sb = new StringBuilder(2 * result.length);
            for (byte b : result) sb.append(String.format("%02x", b & 0xff));
            return sb.toString();
        } catch (Exception ex) {
            return "";
        }
    }
}