package com.qlpk.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Value("${app.cors.allowed-origins:http://localhost:5173,https://qlpk-tamdg.vercel.app}")
    private String allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html", "/api-docs/**", "/error").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/taikhoan/login", "/api/taikhoan/forgot-password/**", "/api/taikhoan/first-time-change-password").permitAll()

                .requestMatchers("/api/tai-khoan-benh-nhan/login", "/api/tai-khoan-benh-nhan/forgot-password/**", "/api/tai-khoan-benh-nhan/verify-email/**").permitAll()
                .requestMatchers("/api/tai-khoan-benh-nhan/refresh-token", "/api/tai-khoan-benh-nhan/logout").permitAll()
                .requestMatchers("/api/taikhoan/refresh-token", "/api/taikhoan/logout").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/tai-khoan-benh-nhan").permitAll()
                .requestMatchers("/api/device-tokens/**", "/api/test-notification/**", "/api/thong-bao/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/patient/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/patient/**").authenticated()
                .requestMatchers("/ws/**", "/api/payment/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/benh-nhan/search", "/api/benh-nhan/exact-match", "/api/benh-nhan/find-flexible").permitAll()
                .requestMatchers("/api/images/**").permitAll()

                .requestMatchers(HttpMethod.GET, "/api/lich-hen/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/lich-hen/**").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/lich-hen/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/lich-hen/**").authenticated()

                .requestMatchers(HttpMethod.GET, "/api/appointments/**").permitAll()
                .requestMatchers(HttpMethod.PUT, "/api/appointments/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/appointments/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/appointments/**").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/taikhoan/*/change-password").authenticated()
                .requestMatchers("/api/dang-ky/**").authenticated()

                .requestMatchers(HttpMethod.GET, "/api/chuyen-khoa/**", "/api/danhmuc/chuyen-khoa/**", "/api/dich-vu/**", "/api/danh-muc-benh-ly/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/phan-cong/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/lich-bac-si/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/phan-cong/**").hasRole("QUAN_TRI_VIEN")
                .requestMatchers(HttpMethod.PUT, "/api/phan-cong/**").hasRole("QUAN_TRI_VIEN")
                .requestMatchers(HttpMethod.DELETE, "/api/phan-cong/**").hasRole("QUAN_TRI_VIEN")

                .requestMatchers(HttpMethod.GET, "/api/ca-lam/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/ca-lam/**").hasRole("QUAN_TRI_VIEN")
                .requestMatchers(HttpMethod.PUT, "/api/ca-lam/**").hasRole("QUAN_TRI_VIEN")
                .requestMatchers(HttpMethod.DELETE, "/api/ca-lam/**").hasRole("QUAN_TRI_VIEN")

                .requestMatchers(HttpMethod.POST, "/api/chuyen-khoa/**").hasRole("QUAN_TRI_VIEN")
                .requestMatchers(HttpMethod.PUT, "/api/chuyen-khoa/**").hasRole("QUAN_TRI_VIEN")
                .requestMatchers(HttpMethod.DELETE, "/api/chuyen-khoa/**").hasRole("QUAN_TRI_VIEN")
                .requestMatchers(HttpMethod.GET, "/api/nhan_vien", "/api/nhan_vien/{id}", "/api/nhan_vien/by-chuc-vu", "/api/nhan-vien", "/api/nhan-vien/{id}", "/api/nhan-vien/by-chuc-vu").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/hoa-don/*/reset-vnpay-pending").permitAll()
                .requestMatchers("/api/taikhoan/**", "/api/nhan-vien/**").hasRole("QUAN_TRI_VIEN")
                .requestMatchers("/api/nhan_vien/**").hasRole("QUAN_TRI_VIEN")
                .requestMatchers(HttpMethod.POST, "/api/hoa-don/*/thanh-toan").hasAnyRole("THU_NGAN", "QUAN_TRI_VIEN", "LE_TAN")
                .requestMatchers(HttpMethod.POST, "/api/hoa-don/*/tao-thong-bao").hasAnyRole("THU_NGAN", "QUAN_TRI_VIEN", "LE_TAN")
                .requestMatchers(HttpMethod.POST, "/api/phieu-kham/full-check-in").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/phieu-kham/accept-patient/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/phieu-kham/**").authenticated()

                .requestMatchers(HttpMethod.POST, "/api/internal/**").permitAll()
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write(new ObjectMapper().writeValueAsString(
                        Map.of(
                            "message", "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.",
                            "error", authException.getMessage() != null ? authException.getMessage() : "UNAUTHORIZED"
                        )
                    ));
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write(new ObjectMapper().writeValueAsString(
                        Map.of(
                            "message", "Bạn không có quyền thực hiện hành động này.",
                            "error", accessDeniedException.getMessage() != null ? accessDeniedException.getMessage() : "FORBIDDEN"
                        )
                    ));
                })
            )
            .httpBasic(basic -> basic.disable())
            .formLogin(form -> form.disable());
        return http.build();
    }
}
