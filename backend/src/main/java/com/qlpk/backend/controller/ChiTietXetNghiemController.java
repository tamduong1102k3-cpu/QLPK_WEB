package com.qlpk.backend.controller;

import com.qlpk.backend.entity.ChiTietXetNghiem;
import com.qlpk.backend.service.ChiTietXetNghiemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chi-tiet-xet-nghiem")
public class ChiTietXetNghiemController {

    @Autowired
    private ChiTietXetNghiemService service;

    @GetMapping
    public List<ChiTietXetNghiem> getAll() {
        return service.getAll();
    }

    @GetMapping("/dich-vu/{maDichVu}")
    public List<ChiTietXetNghiem> getByMaDichVu(@PathVariable Integer maDichVu) {
        return service.getByMaDichVu(maDichVu);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChiTietXetNghiem> getById(@PathVariable Integer id) {
        ChiTietXetNghiem entity = service.getById(id);
        if (entity == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(entity);
    }

    @PostMapping
    public ResponseEntity<ChiTietXetNghiem> create(@RequestBody ChiTietXetNghiem entity) {
        return ResponseEntity.ok(service.create(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ChiTietXetNghiem> update(@PathVariable Integer id, @RequestBody ChiTietXetNghiem entity) {
        ChiTietXetNghiem updated = service.update(id, entity);
        if (updated == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        if (service.getById(id) == null) return ResponseEntity.notFound().build();
        service.delete(id);
        return ResponseEntity.ok().build();
    }
}
