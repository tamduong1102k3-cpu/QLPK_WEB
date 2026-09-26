package com.qlpk.backend.controller;

import com.qlpk.backend.entity.NhanVien;
import com.qlpk.backend.dto.NhanVienRequestDTO;
import com.qlpk.backend.service.NhanVienService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/nhan_vien")
public class NhanVienController {

    @Autowired
    private NhanVienService nhanVienService;

    @GetMapping
    public ResponseEntity<List<NhanVien>> getAllNhanVien() {
        return ResponseEntity.ok(nhanVienService.getAllNhanVien());
    }

    @GetMapping("/search")
    public ResponseEntity<List<NhanVien>> searchNhanVien(
            @RequestParam(required = false, defaultValue = "") String keyword,
            @RequestParam(required = false) Integer chuyenKhoa,
            @RequestParam(required = false) String vaiTro) {
        return ResponseEntity.ok(nhanVienService.searchNhanVien(keyword.trim(), chuyenKhoa, vaiTro));
    }

    @GetMapping("/by-chuc-vu")
    public ResponseEntity<List<NhanVien>> getByChucVu(@RequestParam String chucVu) {
        return ResponseEntity.ok(nhanVienService.getNhanVienByChucVu(chucVu));
    }

    @GetMapping("/by-chuyen-khoa")
    public ResponseEntity<List<NhanVien>> getByChuyenKhoa(@RequestParam Integer chuyenKhoa) {
        return ResponseEntity.ok(nhanVienService.getNhanVienByChuyenKhoa(chuyenKhoa));
    }

    @GetMapping("/bac-si-by-chuyen-khoa")
    public ResponseEntity<List<NhanVien>> getBacSiByChuyenKhoa(@RequestParam Integer chuyenKhoa) {
        return ResponseEntity.ok(nhanVienService.getBacSiByChuyenKhoa(chuyenKhoa));
    }

    @PostMapping
    public ResponseEntity<?> addNhanVien(@RequestBody NhanVienRequestDTO dto) {
        try {
            nhanVienService.addNhanVienViaProcedure(dto);
            return ResponseEntity.ok(Map.of("message", "Thêm nhân viên và tạo tài khoản thành công!"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("message", "Lỗi khi thêm nhân viên: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<NhanVien> getNhanVienById(@PathVariable Integer id) {
        NhanVien nv = nhanVienService.getNhanVienById(id);
        if (nv != null) return ResponseEntity.ok(nv);
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateNhanVien(@PathVariable Integer id, @RequestBody NhanVienRequestDTO dto) {
        try {
            nhanVienService.updateNhanVien(id, dto);
            return ResponseEntity.ok(Map.of("message", "Cập nhật nhân viên thành công!"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("message", "Lỗi khi cập nhật: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNhanVien(@PathVariable Integer id) {
        try {
            nhanVienService.deleteNhanVien(id);
            return ResponseEntity.ok(Map.of("message", "Xóa nhân viên thành công!"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("message", "Lỗi khi xóa nhân viên: " + e.getMessage()));
        }
    }
}
