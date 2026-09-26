package com.qlpk.backend.controller;

import com.qlpk.backend.config.JwtUtils;
import com.qlpk.backend.entity.KetQuaXetNghiem;
import com.qlpk.backend.service.BangPhanCongCaLamService;
import com.qlpk.backend.service.KetQuaXetNghiemService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ket-qua-xet-nghiem")
public class KetQuaXetNghiemController {

    @Autowired
    private KetQuaXetNghiemService service;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private BangPhanCongCaLamService bangPhanCongService;

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

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveResult(@PathVariable Integer id) {
        KetQuaXetNghiem updated = service.updateStatus(id, "DA_DUYET");
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }
}
