package com.qlpk.backend.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.Map;

@Component
public class JwtUtils {

    @Value("${jwt.secret:VXNlclNlY3JldEtleUZvclBKU1Rva2VuU2lnbmluZ0pXVA==}")
    private String secretBase64;

    @Value("${jwt.expiration:900000}")
    private long expirationTime;

    @Value("${jwt.refresh-expiration:604800000}")
    private long refreshExpirationTime;

    private SecretKey secretKey;

    @PostConstruct
    public void init() {

        byte[] keyBytes = Base64.getDecoder().decode(secretBase64);
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(String username, Integer maNhanVien, String role, String email, Integer maTaiKhoan, Integer maChuyenKhoa) {
        return Jwts.builder()
                .setSubject(username)
                .addClaims(Map.of(
                    "maNhanVien", maNhanVien != null ? maNhanVien : 0,
                    "role", role != null ? role : "",
                    "email", email != null ? email : "",
                    "maTaiKhoan", maTaiKhoan != null ? maTaiKhoan : 0,
                    "maChuyenKhoa", maChuyenKhoa != null ? maChuyenKhoa : 0
                ))
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationTime))
                .signWith(secretKey)
                .compact();
    }

    public String generatePatientToken(String username, Integer maTaiKhoanBn, String role, String email) {
        return Jwts.builder()
                .setSubject(username)
                .addClaims(Map.of(
                    "maTaiKhoanBn", maTaiKhoanBn != null ? maTaiKhoanBn : 0,
                    "role", role != null ? role : "",
                    "email", email != null ? email : ""
                ))
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationTime))
                .signWith(secretKey)
                .compact();
    }

    public String generatePatientTokenWithMaBenhNhan(String username, Integer maTaiKhoanBn, String role, Integer maBenhNhan, String email) {
        return Jwts.builder()
                .setSubject(username)
                .addClaims(Map.of(
                    "maTaiKhoanBn", maTaiKhoanBn != null ? maTaiKhoanBn : 0,
                    "maBenhNhan", maBenhNhan != null ? maBenhNhan : 0,
                    "role", role != null ? role : "",
                    "email", email != null ? email : ""
                ))
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationTime))
                .signWith(secretKey)
                .compact();
    }

    public String generateRefreshToken(String username, Integer maTaiKhoanBn, String role, Integer maBenhNhan, String email) {
        return Jwts.builder()
                .setSubject(username)
                .addClaims(Map.of(
                    "maTaiKhoanBn", maTaiKhoanBn != null ? maTaiKhoanBn : 0,
                    "maBenhNhan", maBenhNhan != null ? maBenhNhan : 0,
                    "role", role != null ? role : "",
                    "email", email != null ? email : "",
                    "tokenType", "refresh"
                ))
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + refreshExpirationTime))
                .signWith(secretKey)
                .compact();
    }

    public String generateEmployeeRefreshToken(String username, Integer maNhanVien, String role, String email, Integer maTaiKhoan, Integer maChuyenKhoa) {
        return Jwts.builder()
                .setSubject(username)
                .addClaims(Map.of(
                    "maNhanVien", maNhanVien != null ? maNhanVien : 0,
                    "role", role != null ? role : "",
                    "email", email != null ? email : "",
                    "maTaiKhoan", maTaiKhoan != null ? maTaiKhoan : 0,
                    "maChuyenKhoa", maChuyenKhoa != null ? maChuyenKhoa : 0,
                    "tokenType", "refresh"
                ))
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + refreshExpirationTime))
                .signWith(secretKey)
                .compact();
    }

    public boolean isRefreshToken(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
            return "refresh".equals(claims.get("tokenType", String.class));
        } catch (Exception e) {
            return false;
        }
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String getUsernameFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
            .setSigningKey(secretKey)
            .build()
            .parseClaimsJws(token)
            .getBody();
        return claims.getSubject();
    }

    public String getRoleFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
            .setSigningKey(secretKey)
            .build()
            .parseClaimsJws(token)
            .getBody();
        return claims.get("role", String.class);
    }

    public Integer getMaTaiKhoanBnFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
            .setSigningKey(secretKey)
            .build()
            .parseClaimsJws(token)
            .getBody();
        Object value = claims.get("maTaiKhoanBn");
        if (value instanceof Integer) {
            return (Integer) value;
        }
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return null;
    }

    public String getEmailFromToken(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
            return claims.get("email", String.class);
        } catch (Exception e) {
            return null;
        }
    }

    public Integer getMaTaiKhoanFromToken(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
            Object value = claims.get("maTaiKhoan");
            if (value instanceof Integer) return (Integer) value;
            if (value instanceof Number) return ((Number) value).intValue();
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    public Integer getMaNhanVienFromToken(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
            Object value = claims.get("maNhanVien");
            if (value instanceof Integer) return (Integer) value;
            if (value instanceof Number) return ((Number) value).intValue();
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    public Integer getMaChuyenKhoaFromToken(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
            Object value = claims.get("maChuyenKhoa");
            if (value instanceof Integer) return (Integer) value;
            if (value instanceof Number) return ((Number) value).intValue();
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    public Integer getMaBenhNhanFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
            .setSigningKey(secretKey)
            .build()
            .parseClaimsJws(token)
            .getBody();
        Object value = claims.get("maBenhNhan");
        if (value instanceof Integer) {
            return (Integer) value;
        }
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return null;
    }
}
