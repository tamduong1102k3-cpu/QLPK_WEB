package com.qlpk.backend.controller;

import com.qlpk.backend.entity.ChucVu;
import com.qlpk.backend.entity.ChuyenKhoa;
import com.qlpk.backend.entity.HanMucNgay;
import com.qlpk.backend.entity.PhongChucNang;
import com.qlpk.backend.entity.VaiTro;
import com.qlpk.backend.repository.HanMucNgayRepository;
import com.qlpk.backend.service.ChucVuService;
import com.qlpk.backend.service.ChuyenKhoaService;
import com.qlpk.backend.service.PhongChucNangService;
import com.qlpk.backend.service.VaiTroService;
import com.qlpk.backend.util.TimeUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/danhmuc")
public class DanhMucController {

    @Autowired private ChucVuService chucVuService;
    @Autowired private ChuyenKhoaService chuyenKhoaService;
    @Autowired private VaiTroService vaiTroService;
    @Autowired private PhongChucNangService phongChucNangService;
    @Autowired private HanMucNgayRepository hanMucNgayRepository;

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

    @GetMapping("/phong/by-chuyen-khoa/{maChuyenKhoa}")
    public ResponseEntity<List<Map<String, Object>>> getPhongByChuyenKhoa(
            @PathVariable Integer maChuyenKhoa) {
        List<PhongChucNang> list = phongChucNangService.findByMaChuyenKhoa(maChuyenKhoa);
        LocalDate today = TimeUtil.today();
        List<HanMucNgay> hanMucList = hanMucNgayRepository.findByNgay(today);
        List<Map<String, Object>> result = new ArrayList<>();
        for (PhongChucNang p : list) {
            int soDaDat = hanMucList.stream()
                .filter(h -> h.getMaPhong() != null && h.getMaPhong().equals(p.getMaPhong()))
                .findFirst().map(HanMucNgay::getSoDaDat).orElse(0);
            Map<String, Object> item = new HashMap<>();
            item.put("maPhong", p.getMaPhong());
            item.put("tenPhong", p.getTenPhong());
            item.put("soDaDat", soDaDat);
            item.put("soLuongToiDa", p.getSoLuongToiDa());
            result.add(item);
        }
        return ResponseEntity.ok(result);
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
