package com.qlpk.backend.controller;

import com.qlpk.backend.entity.DanhMucBenhLy;
import com.qlpk.backend.service.DanhMucBenhLyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/danh-muc-benh-ly")
public class DanhMucBenhLyController {

    @Autowired
    private DanhMucBenhLyService danhMucBenhLyService;

    @GetMapping("/chuyen-khoa/{maChuyenKhoa}")
    public ResponseEntity<?> getBenhByChuyenKhoa(@PathVariable Integer maChuyenKhoa) {
        try {
            List<DanhMucBenhLy> list = danhMucBenhLyService.getBenhByChuyenKhoa(maChuyenKhoa);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", list,
                "total", list.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Lỗi: " + e.getMessage()
            ));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAll() {
        try {
            List<DanhMucBenhLy> list = danhMucBenhLyService.getAll();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", list,
                "total", list.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Lỗi: " + e.getMessage()
            ));
        }
    }
}
