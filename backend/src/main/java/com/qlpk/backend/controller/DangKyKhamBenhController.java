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
    public ResponseEntity<DangKyKhamBenh> create(@RequestBody CreateDangKyKhamBenhRequest request) {
        DangKyKhamBenh created = service.create(request);
        return ResponseEntity.ok(created);
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
        Integer maNhanVien = getMaNhanVienFromRequest(request);
        if (maNhanVien == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Chưa xác thực"));
        }

        final Integer maPhongTruc;
        try {
            maPhongTruc = bangPhanCongService.getPhongDangTrucCuaUser(maNhanVien);
        } catch (RuntimeException e) {
            return ResponseEntity.ok(List.of());
        }

        List<Map<String, Object>> list;
        if (keyword != null && !keyword.trim().isEmpty()) {
            list = service.getTodayRegistrationsDetailedWithSearch(keyword.trim());
        } else {
            list = service.getTodayRegistrationsDetailed();
        }

        if (maPhongTruc != null) {
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

    private Integer getMaNhanVienFromRequest(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) return null;
        return jwtUtils.getMaNhanVienFromToken(header.substring(7));
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
