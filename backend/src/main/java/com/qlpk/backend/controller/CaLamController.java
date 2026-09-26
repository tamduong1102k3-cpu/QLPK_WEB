package com.qlpk.backend.controller;

import com.qlpk.backend.dto.LichThangDTO;
import com.qlpk.backend.entity.CaLam;
import com.qlpk.backend.service.BangPhanCongCaLamService;
import com.qlpk.backend.service.CaLamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Collections;

@RestController
@RequestMapping("/api/ca-lam-danh-muc")
public class CaLamController {

    @Autowired
    private CaLamService service;

    @Autowired
    private BangPhanCongCaLamService bangPhanCongService;

    @GetMapping
    public ResponseEntity<List<CaLam>> getAll() {
        try {
            List<CaLam> list = service.getAll();
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping
    public ResponseEntity<CaLam> create(@RequestBody CaLam entity) {
        try {
            CaLam created = service.create(entity);
            return ResponseEntity.ok(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<CaLam> update(@PathVariable Integer id, @RequestBody CaLam entity) {
        try {
            CaLam updated = service.update(id, entity);
            if (updated == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        try {
            service.delete(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/thang")
    public ResponseEntity<LichThangDTO> getMonthSchedule(
            @RequestParam Integer maNhanVien,
            @RequestParam int nam,
            @RequestParam int thang) {
        try {
            LichThangDTO result = bangPhanCongService.getLichThang(maNhanVien, nam, thang);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
}
