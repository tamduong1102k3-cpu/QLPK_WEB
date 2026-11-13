package com.qlpk.backend.controller;

import com.qlpk.backend.config.JwtUtils;
import com.qlpk.backend.dto.CreateDangKyKhamBenhRequest;
import com.qlpk.backend.entity.DangKyKhamBenh;
import com.qlpk.backend.service.BangPhanCongCaLamService;
import com.qlpk.backend.service.DangKyKhamBenhService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dang-ky")
public class DangKyKhamBenhController {

    @Autowired
    private DangKyKhamBenhService service;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private BangPhanCongCaLamService bangPhanCongService;

    @GetMapping
    public ResponseEntity<List<DangKyKhamBenh>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DangKyKhamBenh> getById(@PathVariable Integer id) {
        DangKyKhamBenh entity = service.getById(id);
        if (entity != null) {
            return ResponseEntity.ok(entity);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateDangKyKhamBenhRequest request) {
        try {
            DangKyKhamBenh created = service.create(request);
            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<DangKyKhamBenh> update(@PathVariable Integer id, @RequestBody DangKyKhamBenh entity) {
        entity.setId(id);
        DangKyKhamBenh updated = service.update(id, entity);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/today")
    public ResponseEntity<?> getToday(
            @RequestParam(value = "keyword", required = false, defaultValue = "") String keyword,
            HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        String token = header != null && header.startsWith("Bearer ") ? header.substring(7) : null;
        Integer maNhanVien = token != null ? jwtUtils.getMaNhanVienFromToken(token) : null;
        if (maNhanVien == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Chưa xác thực"));
        }

        String role = jwtUtils.getRoleFromToken(token);
        boolean isBacSi = role != null && (role.equals("BAC_SI") || role.startsWith("BAC_SI_"));

        List<Map<String, Object>> list;
        if (keyword != null && !keyword.trim().isEmpty()) {
            list = service.getTodayRegistrationsDetailedWithSearch(
                    keyword.trim(), isBacSi ? maNhanVien : null);
        } else {
            list = service.getTodayRegistrationsDetailed(isBacSi ? maNhanVien : null);
        }

        if (!isBacSi) {
            final Integer maPhongTruc;
            try {
                maPhongTruc = bangPhanCongService.getPhongDangTrucCuaUser(maNhanVien);
            } catch (RuntimeException e) {
                return ResponseEntity.ok(List.of());
            }
            if (maPhongTruc == null) {
                return ResponseEntity.ok(list);
            }
            list = list.stream()
                .filter(row -> {
                    Object v = row.get("maPhong");
                    if (v == null) return false;
                    return maPhongTruc.intValue() == ((Number) v).intValue();
                })
                .collect(Collectors.toList());
        }
        return ResponseEntity.ok(list);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Integer id, @RequestBody Map<String, String> payload) {
        String status = payload.get("trangThai");
        if (status == null || status.isEmpty()) {
            return ResponseEntity.badRequest().body("Thiếu thông tin trangThai");
        }
        
        DangKyKhamBenh updated = service.updateStatus(id, status);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

}
