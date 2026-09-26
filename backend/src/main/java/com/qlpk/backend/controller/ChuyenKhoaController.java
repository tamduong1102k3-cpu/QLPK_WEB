package com.qlpk.backend.controller;

import com.qlpk.backend.entity.ChuyenKhoa;
import com.qlpk.backend.service.ChuyenKhoaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chuyen-khoa")
public class ChuyenKhoaController {

    @Autowired
    private ChuyenKhoaService chuyenKhoaService;

    @GetMapping
    public ResponseEntity<List<ChuyenKhoa>> getAll() {
        return ResponseEntity.ok(chuyenKhoaService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChuyenKhoa> getById(@PathVariable Integer id) {
        ChuyenKhoa entity = chuyenKhoaService.getById(id);
        if (entity == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(entity);
    }

    @PostMapping
    public ResponseEntity<ChuyenKhoa> create(@RequestBody ChuyenKhoa entity) {
        return ResponseEntity.ok(chuyenKhoaService.create(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ChuyenKhoa> update(@PathVariable Integer id, @RequestBody ChuyenKhoa entity) {
        ChuyenKhoa updated = chuyenKhoaService.update(id, entity);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        if (chuyenKhoaService.getById(id) == null) {
            return ResponseEntity.notFound().build();
        }
        chuyenKhoaService.delete(id);
        return ResponseEntity.ok().build();
    }

}
