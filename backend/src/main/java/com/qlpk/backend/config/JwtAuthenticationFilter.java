package com.qlpk.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Map;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Autowired
    private JwtUtils jwtUtils;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private boolean isPublicAuthPath(String path, String method) {
        if (path == null) return false;
        if (path.equals("/api/taikhoan/login")
            || path.equals("/api/tai-khoan-benh-nhan/login")
            || path.equals("/api/taikhoan/refresh-token")
            || path.equals("/api/taikhoan/logout")
            || path.equals("/api/tai-khoan-benh-nhan/refresh-token")
            || path.equals("/api/tai-khoan-benh-nhan/logout")) {
            return true;
        }
        if (path.startsWith("/api/taikhoan/forgot-password/")
            || path.startsWith("/api/tai-khoan-benh-nhan/forgot-password/")
            || path.equals("/api/tai-khoan-benh-nhan/forgot-password")
            || path.startsWith("/api/tai-khoan-benh-nhan/verify-email/")) {
            return true;
        }
        if ("POST".equalsIgnoreCase(method)
            && (path.equals("/api/tai-khoan-benh-nhan") || path.equals("/api/tai-khoan-benh-nhan/"))) {
            return true;
        }
        return false;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {
        
        String path = request.getRequestURI();
        boolean restoreRequest = "POST".equalsIgnoreCase(request.getMethod())
            && "/api/admin/backup/restore".equals(path);
        if (restoreRequest) {
            log.info("Backup restore reached security chain: origin={} accept={} requestContentType={}",
                request.getHeader("Origin"),
                request.getHeader("Accept"),
                request.getContentType());
        }
        
        if ("OPTIONS".equalsIgnoreCase(request.getMethod()) || isPublicAuthPath(path, request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String header = request.getHeader("Authorization");
        
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            
            if (jwtUtils.validateToken(token)) {
                String username = jwtUtils.getUsernameFromToken(token);
                String role = jwtUtils.getRoleFromToken(token);
                
                SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + (role != null ? role : ""));
                UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(username, null, Collections.singletonList(authority));
                authentication.setDetails(jwtUtils.getMaTaiKhoanFromToken(token));
                
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write(objectMapper.writeValueAsString(
                    Map.of("message", "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.")
                ));
                if (restoreRequest) {
                    log.info("Backup restore rejected by JWT filter: status={} responseContentType={}",
                        response.getStatus(),
                        response.getContentType());
                }
                return;
            }
        }
        
        try {
            filterChain.doFilter(request, response);
        } finally {
            if (restoreRequest) {
                log.info("Backup restore left security chain: status={} responseContentType={}",
                    response.getStatus(),
                    response.getContentType());
            }
        }
    }
}
