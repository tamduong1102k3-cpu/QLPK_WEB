package com.qlpk.backend.controller;

import com.qlpk.backend.config.JwtUtils;
import com.qlpk.backend.util.TimeUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dang-ky/today")
public class DangKyKhamBenhTodayAllController {

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final JwtUtils jwtUtils;

    public DangKyKhamBenhTodayAllController(
            NamedParameterJdbcTemplate jdbcTemplate,
            JwtUtils jwtUtils) {
        this.jdbcTemplate = jdbcTemplate;
        this.jwtUtils = jwtUtils;
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllTodayRegistrations(HttpServletRequest request) {
        String authorization = request.getHeader("Authorization");
        if (authorization == null || !authorization.startsWith("Bearer ")
                || jwtUtils.getMaNhanVienFromToken(authorization.substring(7)) == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Chưa xác thực"));
        }

        LocalDateTime startOfDay = TimeUtil.today().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        String sql = """
                SELECT d.id AS id,
                       d.ma_benh_nhan AS maBenhNhan,
                       d.so_thu_tu AS soThuTu,
                       b.ho_ten AS hoTen,
                       d.ma_dich_vu AS maDichVu,
                       dv.ten_dich_vu AS tenDichVu,
                       d.thoi_gian_dang_ky AS thoiGian,
                       d.trang_thai AS trangThai
                FROM dang_ky_kham_benh d
                LEFT JOIN benh_nhan b ON b.ma_benh_nhan = d.ma_benh_nhan
                LEFT JOIN dich_vu dv ON dv.ma_dich_vu = d.ma_dich_vu
                WHERE d.thoi_gian_dang_ky >= :startOfDay
                  AND d.thoi_gian_dang_ky < :endOfDay
                ORDER BY d.so_thu_tu ASC
                """;
        MapSqlParameterSource parameters = new MapSqlParameterSource()
                .addValue("startOfDay", startOfDay)
                .addValue("endOfDay", endOfDay);
        List<Map<String, Object>> registrations = jdbcTemplate.queryForList(sql, parameters);
        return ResponseEntity.ok(registrations);
    }
}
