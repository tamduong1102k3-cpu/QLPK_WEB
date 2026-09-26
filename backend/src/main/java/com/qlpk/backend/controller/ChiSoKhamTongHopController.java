package com.qlpk.backend.controller;

import com.qlpk.backend.entity.ChiSoKhamTongHop;
import com.qlpk.backend.service.ChiSoKhamTongHopService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/chi-so-kham-tong-hop")
public class ChiSoKhamTongHopController {

    @Autowired
    private ChiSoKhamTongHopService service;

    @GetMapping
    public ResponseEntity<List<ChiSoKhamTongHop>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Integer id) {
        ChiSoKhamTongHop data = service.getById(id);
        if (data != null) {
            return ResponseEntity.ok(data);
        }
        return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy dữ liệu với ID: " + id));
    }

    @GetMapping("/phieu-kham/{maPhieuKham}")
    public ResponseEntity<?> getByPhieuKham(@PathVariable Integer maPhieuKham) {
        Optional<ChiSoKhamTongHop> data = service.findByMaPhieuKham(maPhieuKham);

        return ResponseEntity.ok(data.orElse(null));
    }

    @GetMapping("/phieu-kham/{maPhieuKham}/all")
    public ResponseEntity<?> getAllByPhieuKham(@PathVariable Integer maPhieuKham) {
        return ResponseEntity.ok(service.findAllByMaPhieuKham(maPhieuKham));
    }

    @PostMapping("/save-and-update")
    public ResponseEntity<?> saveAndUpdate(@RequestBody ChiSoKhamTongHop body) {
        try {
            if (body.getMaPhieuKham() == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Mã phiếu khám không được để trống"));
            }
            ChiSoKhamTongHop saved = service.saveAndUpdatePhieuKham(body);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi hệ thống: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody ChiSoKhamTongHop body) {
        return ResponseEntity.ok(service.create(body));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody ChiSoKhamTongHop body) {
        ChiSoKhamTongHop updated = service.update(id, body);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy ID để cập nhật"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        try {
            service.delete(id);
            return ResponseEntity.ok(Map.of("message", "Xóa thành công"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi khi xóa: " + e.getMessage()));
        }
    }

}
