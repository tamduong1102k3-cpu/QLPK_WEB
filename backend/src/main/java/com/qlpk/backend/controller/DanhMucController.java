package com.qlpk.backend.controller;

import com.qlpk.backend.entity.ChucVu;
import com.qlpk.backend.entity.ChuyenKhoa;
import com.qlpk.backend.entity.PhongChucNang;
import com.qlpk.backend.entity.VaiTro;
import com.qlpk.backend.service.ChucVuService;
import com.qlpk.backend.service.ChuyenKhoaService;
import com.qlpk.backend.service.PhongChucNangService;
import com.qlpk.backend.service.VaiTroService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/danhmuc")
public class DanhMucController {

    @Autowired private ChucVuService chucVuService;
    @Autowired private ChuyenKhoaService chuyenKhoaService;
    @Autowired private VaiTroService vaiTroService;
    @Autowired private PhongChucNangService phongChucNangService;

    @GetMapping("/chuc-vu")
    public ResponseEntity<List<ChucVu>> getAllChucVu() {
        return ResponseEntity.ok(chucVuService.getAll());
    }

    @GetMapping("/chuyen-khoa")
    public ResponseEntity<List<ChuyenKhoa>> getAllChuyenKhoa() {
        return ResponseEntity.ok(chuyenKhoaService.getAll());
    }

    @GetMapping("/vai-tro")
    public ResponseEntity<List<VaiTro>> getAllVaiTro() {
        return ResponseEntity.ok(vaiTroService.getAll());
    }

    @GetMapping("/phong")
    public ResponseEntity<List<PhongChucNang>> getAllPhong() {
        return ResponseEntity.ok(phongChucNangService.getAll());
    }

    @GetMapping("/phong/by-chuc-vu/{maChucVu}")
    public ResponseEntity<List<PhongChucNang>> getPhongByChucVu(@PathVariable Integer maChucVu) {
        return ResponseEntity.ok(phongChucNangService.findByMaChucVu(maChucVu));
    }

    @PostMapping("/phong")
    public ResponseEntity<PhongChucNang> createPhong(@RequestBody PhongChucNang phong) {
        return ResponseEntity.ok(phongChucNangService.create(phong));
    }

    @PutMapping("/phong/{id}")
    public ResponseEntity<PhongChucNang> updatePhong(
            @PathVariable Integer id, @RequestBody PhongChucNang phong) {
        PhongChucNang updated = phongChucNangService.update(id, phong);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/phong/{id}")
    public ResponseEntity<?> deletePhong(@PathVariable Integer id) {
        if (phongChucNangService.getById(id) == null) {
            return ResponseEntity.notFound().build();
        }
        phongChucNangService.delete(id);
        return ResponseEntity.ok().build();
    }
}
