package com.qlpk.backend.controller;

import com.qlpk.backend.config.JwtUtils;
import com.qlpk.backend.entity.KetQuaCdha;
import com.qlpk.backend.service.BangPhanCongCaLamService;
import com.qlpk.backend.service.KetQuaCdhaService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ket-qua-cdha")
public class KetQuaCdhaController {

    @Autowired
    private KetQuaCdhaService service;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private BangPhanCongCaLamService bangPhanCongService;

    @GetMapping
    public ResponseEntity<List<KetQuaCdha>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<KetQuaCdha> getById(@PathVariable Integer id) {
        KetQuaCdha result = service.getById(id);
        if (result != null) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<KetQuaCdha> create(@RequestBody KetQuaCdha entity) {
        try {
            return ResponseEntity.ok(service.create(entity));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<KetQuaCdha> update(@PathVariable Integer id, @RequestBody KetQuaCdha entity) {
        KetQuaCdha updated = service.update(id, entity);
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
    public ResponseEntity<?> getTodayResults(HttpServletRequest request) {
        Integer maNhanVien = getMaNhanVienFromRequest(request);
        if (maNhanVien == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Chưa xác thực"));
        }

        Integer maPhongTruc;
        try {
            maPhongTruc = bangPhanCongService.getPhongDangTrucCuaUser(maNhanVien);
        } catch (RuntimeException e) {
            return ResponseEntity.ok(List.of());
        }

        List<Map<String, Object>> list = service.getTodayResults();
        if (maPhongTruc != null) {
            list = list.stream()
                .filter(row -> {
                    Object v = row.get("maPhong");
                    if (v == null) return true; 
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

    @GetMapping("/today/doctor/{doctorId}")
    public ResponseEntity<List<Map<String, Object>>> getTodayResultsByDoctorId(@PathVariable Integer doctorId) {
        return ResponseEntity.ok(service.getTodayResultsByDoctorId(doctorId));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveResult(@PathVariable Integer id) {
        KetQuaCdha updated = service.updateStatus(id, "DA_DUYET");
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy mã kết quả: " + id));
    }
}
