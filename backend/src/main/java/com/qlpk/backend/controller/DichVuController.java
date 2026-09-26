package com.qlpk.backend.controller;

import com.qlpk.backend.entity.DichVu;
import com.qlpk.backend.service.DichVuService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dich-vu")
public class DichVuController {

    @Autowired
    private DichVuService dichVuService;

    @GetMapping
    public List<DichVu> getAll(@RequestParam(required = false) List<String> loaiDichVu) {
        if (loaiDichVu != null && !loaiDichVu.isEmpty()) {
            return dichVuService.getByLoaiDichVu(loaiDichVu);
        }
        return dichVuService.getAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<DichVu> getById(@PathVariable Integer id) {
        DichVu dv = dichVuService.getById(id);
        if (dv == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(dv);
    }

    @PostMapping
    public ResponseEntity<DichVu> create(@RequestBody DichVu dv) {
        return ResponseEntity.ok(dichVuService.create(dv));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DichVu> update(@PathVariable Integer id, @RequestBody DichVu dv) {
        DichVu updated = dichVuService.update(id, dv);
        if (updated == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        if (dichVuService.getById(id) == null) return ResponseEntity.notFound().build();
        dichVuService.delete(id);
        return ResponseEntity.ok().build();
    }
}
