package com.qlpk.backend.controller;

import com.qlpk.backend.entity.ChiTietPhieuNhapThuoc;
import com.qlpk.backend.entity.KhoThuoc;
import com.qlpk.backend.entity.PhieuNhapThuoc;
import com.qlpk.backend.entity.Thuoc;
import com.qlpk.backend.service.ChiTietPhieuNhapThuocService;
import com.qlpk.backend.service.KhoThuocService;
import com.qlpk.backend.service.PhieuNhapThuocService;
import com.qlpk.backend.service.ThuocService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/kho-thuoc")
public class KhoThuocController {

    @Autowired private KhoThuocService khoThuocService;
    @Autowired private PhieuNhapThuocService phieuNhapThuocService;
    @Autowired private ChiTietPhieuNhapThuocService chiTietPhieuNhapThuocService;
    @Autowired private ThuocService thuocService;

    // ====== Danh sách thuốc ======
    @GetMapping("/thuoc")
    public List<Thuoc> getAllThuoc() {
        return thuocService.getAll();
    }

    @PostMapping("/thuoc")
    public ResponseEntity<Thuoc> createThuoc(@RequestBody Thuoc thuoc) {
        return ResponseEntity.ok(thuocService.create(thuoc));
    }

    @PutMapping("/thuoc/{id}")
    public ResponseEntity<Thuoc> updateThuoc(@PathVariable Integer id, @RequestBody Thuoc thuoc) {
        Thuoc updated = thuocService.update(id, thuoc);
        if (updated == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/thuoc/{id}")
    public ResponseEntity<?> deleteThuoc(@PathVariable Integer id) {
        if (thuocService.getById(id) == null) return ResponseEntity.notFound().build();
        thuocService.delete(id);
        return ResponseEntity.ok().build();
    }

    // ====== Kho thuốc ======
    @GetMapping
    public List<KhoThuoc> getAllKho() {
        return khoThuocService.getAll();
    }

    // ====== Thuốc sắp hết (soLuongTon < threshold, mặc định 20) ======
    @GetMapping("/sap-het")
    public ResponseEntity<List<Map<String, Object>>> getSapHet(
            @RequestParam(defaultValue = "20") Integer threshold) {
        return ResponseEntity.ok(khoThuocService.getSapHet(threshold));
    }

    // ====== Tất cả tồn kho kèm trạng thái cảnh báo ======
    @GetMapping("/canh-bao")
    public ResponseEntity<List<Map<String, Object>>> getAllWithAlertStatus() {
        return ResponseEntity.ok(khoThuocService.getAllWithAlertStatus());
    }

    // ====== Danh sách thuốc đang có cảnh báo (soLuongTon < 50) ======
    @GetMapping("/canh-bao/thuoc")
    public ResponseEntity<List<Map<String, Object>>> getAlertList() {
        return ResponseEntity.ok(khoThuocService.getAlertList());
    }

    // ====== Phiếu nhập thuốc ======
    @GetMapping("/phieu-nhap")
    public List<PhieuNhapThuoc> getAllPhieuNhap() {
        return phieuNhapThuocService.getAll();
    }

    @GetMapping("/phieu-nhap/{id}")
    public ResponseEntity<PhieuNhapThuoc> getPhieuNhapById(@PathVariable Integer id) {
        PhieuNhapThuoc phieu = phieuNhapThuocService.getById(id);
        if (phieu != null) return ResponseEntity.ok(phieu);
        return ResponseEntity.notFound().build();
    }

    // ====== Chi tiết phiếu nhập ======
    @GetMapping("/phieu-nhap/{id}/chi-tiet")
    public List<ChiTietPhieuNhapThuoc> getChiTietPhieuNhap(@PathVariable Integer id) {
        return chiTietPhieuNhapThuocService.findByMaPhieuNhapThuoc(id);
    }

    // ====== Tạo phiếu nhập thuốc (có cập nhật kho) ======
    @PostMapping("/phieu-nhap")
    public ResponseEntity<?> createPhieuNhap(@RequestBody Map<String, Object> request) {
        try {
            PhieuNhapThuoc savedPhieu = phieuNhapThuocService.createPhieuNhap(request);
            return ResponseEntity.ok(savedPhieu);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

