package com.qlpk.backend.controller;

import com.qlpk.backend.config.JwtUtils;
import com.qlpk.backend.dto.ReferralRequest;
import com.qlpk.backend.entity.ChiTietChiDinh;
import com.qlpk.backend.entity.PhieuChiDinh;
import com.qlpk.backend.service.BangPhanCongCaLamService;
import com.qlpk.backend.service.CloudinaryService;
import com.qlpk.backend.service.PhieuChiDinhService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/phieu-chi-dinh")
public class PhieuChiDinhController {

    @Autowired
    private PhieuChiDinhService phieuChiDinhService;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private BangPhanCongCaLamService bangPhanCongService;

    @GetMapping("/pending-tests")
    public ResponseEntity<?> getPendingTests(@RequestParam(value = "maChuyenKhoa", required = false) Integer maChuyenKhoa,
                                             HttpServletRequest request) {
        Integer maNhanVien = getMaNhanVienFromRequest(request);
        if (maNhanVien == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Chưa xác thực"));
        }

        Integer maPhongTruc;
        try {
            maPhongTruc = bangPhanCongService.getPhongDangTrucCuaUser(maNhanVien);
        } catch (RuntimeException e) {
            return ResponseEntity.ok(List.of());
        }

        List<Map<String, Object>> list = phieuChiDinhService.getPendingTests(maChuyenKhoa);
        if (maPhongTruc != null) {
            list = list.stream()
                .filter(row -> {
                    Object v = row.get("maPhong");
                    if (v == null) return true; 
                    return maPhongTruc.intValue() == ((Number) v).intValue();
                })
                .collect(Collectors.toList());
        }
        return ResponseEntity.ok(list);
    }

    @GetMapping("/completed-tests-today")
    public ResponseEntity<?> getCompletedTestsToday(@RequestParam(value = "maChuyenKhoa", required = false) Integer maChuyenKhoa,
                                                    HttpServletRequest request) {
        Integer maNhanVien = getMaNhanVienFromRequest(request);
        if (maNhanVien == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Chưa xác thực"));
        }

        Integer maPhongTruc;
        try {
            maPhongTruc = bangPhanCongService.getPhongDangTrucCuaUser(maNhanVien);
        } catch (RuntimeException e) {
            return ResponseEntity.ok(List.of());
        }

        List<Map<String, Object>> list = phieuChiDinhService.getCompletedTestsToday(maChuyenKhoa);
        if (maPhongTruc != null) {
            list = list.stream()
                .filter(row -> {
                    Object v = row.get("maPhong");
                    if (v == null) return true; 
                    return maPhongTruc.intValue() == ((Number) v).intValue();
                })
                .collect(Collectors.toList());
        }
        return ResponseEntity.ok(list);
    }

    private Integer getMaNhanVienFromRequest(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) return null;
        return jwtUtils.getMaNhanVienFromToken(header.substring(7));
    }

    @PostMapping("/submit-result")
    public ResponseEntity<?> submitTestResult(@RequestBody Map<String, Object> body) {
        try {
            phieuChiDinhService.submitTestResult(body);
            return ResponseEntity.ok(Map.of("message", "Cập nhật kết quả thành công!"));
        } catch (Exception e) {
            e.printStackTrace();
            if (e.getMessage().contains("Thiếu thông tin") || e.getMessage().contains("Không tìm thấy")) {
                return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
            }
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody ReferralRequest request) {
        try {
            PhieuChiDinh savedPk = phieuChiDinhService.create(request);
            return ResponseEntity.ok(savedPk);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }

    @GetMapping("/phieu-kham/{maPhieuKham}")
    public ResponseEntity<?> getByPhieuKham(@PathVariable Integer maPhieuKham) {
        return ResponseEntity.ok(phieuChiDinhService.getByPhieuKham(maPhieuKham));
    }

    @GetMapping("/benh-nhan/{maBenhNhan}")
    public ResponseEntity<?> getByBenhNhan(@PathVariable Integer maBenhNhan) {
        return ResponseEntity.ok(phieuChiDinhService.getByBenhNhan(maBenhNhan));
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<?> getDetails(@PathVariable Integer id) {
        return ResponseEntity.ok(phieuChiDinhService.getDetails(id));
    }

    @GetMapping("/result-cdha/{detailId}")
    public ResponseEntity<?> getCdhaResult(@PathVariable Integer detailId) {
        Object result = phieuChiDinhService.getCdhaResult(detailId);
        if (result != null) return ResponseEntity.ok(result);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/result-xet-nghiem/{detailId}")
    public ResponseEntity<?> getXetNhiemResult(@PathVariable Integer detailId) {
        Object result = phieuChiDinhService.getXetNhiemResult(detailId);
        if (result != null) return ResponseEntity.ok(result);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/phieu-kham/{maPhieuKham}/result-xet-nghiem")
    public ResponseEntity<?> getXetNhiemResultsByPhieuKham(@PathVariable Integer maPhieuKham) {
        return ResponseEntity.ok(phieuChiDinhService.getXetNhiemResultsByPhieuKham(maPhieuKham));
    }

    @PostMapping("/approve-result/{id}")
    public ResponseEntity<?> approveTestResult(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        try {
            phieuChiDinhService.approveTestResult(id, body);
            return ResponseEntity.ok(Map.of("message", "Duyệt kết quả xét nghiệm thành công!"));
        } catch (Exception e) {
            e.printStackTrace();
            if (e.getMessage().contains("Không tìm thấy")) return ResponseEntity.notFound().build();
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }

    @Autowired
    private CloudinaryService cloudinaryService;

    @PostMapping("/upload-image")
    public ResponseEntity<?> uploadImage(@RequestParam("image") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "File rỗng"));
            }

            String url = cloudinaryService.uploadFile(file);
            return ResponseEntity.ok(Map.of(
                "url", url,
                "message", "Upload ảnh lên Cloudinary thành công!"
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi upload ảnh lên Cloudinary: " + e.getMessage()));
        }
    }

    @GetMapping("/pending-approval")
    public ResponseEntity<?> getPendingApprovalList(@RequestParam(value = "maChuyenKhoa", required = false) Integer maChuyenKhoa) {
        return ResponseEntity.ok(phieuChiDinhService.getPendingApprovalList(maChuyenKhoa));
    }

    @GetMapping("/approved-list")
    public ResponseEntity<?> getApprovedList(@RequestParam(value = "maChuyenKhoa", required = false) Integer maChuyenKhoa) {
        return ResponseEntity.ok(phieuChiDinhService.getApprovedList(maChuyenKhoa));
    }

    @GetMapping("/approved-history")
    public ResponseEntity<?> getApprovedHistory(@RequestParam Integer maBacSi) {
        try {
            return ResponseEntity.ok(phieuChiDinhService.getApprovedHistory(maBacSi));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }

    @PostMapping("/reject-result/{id}")
    public ResponseEntity<?> rejectTestResult(@PathVariable Integer id, @RequestBody Map<String, String> body) {
        try {
            phieuChiDinhService.rejectTestResult(id, body);
            return ResponseEntity.ok(Map.of("message", "Đã từ chối kết quả xét nghiệm"));
        } catch (Exception e) {
            e.printStackTrace();
            if (e.getMessage().contains("Vui lòng nhập")) return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
            if (e.getMessage().contains("Không tìm thấy")) return ResponseEntity.notFound().build();
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }

    @GetMapping("/phieu-kham/{maPhieuKham}/result-cdha")
    public ResponseEntity<?> getCdhaResultsByPhieuKham(@PathVariable Integer maPhieuKham) {
        try {
            return ResponseEntity.ok(phieuChiDinhService.getCdhaResultsByPhieuKham(maPhieuKham));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }

    @PostMapping("/approve-cdha/{detailId}")
    public ResponseEntity<?> approveCdhaResult(@PathVariable Integer detailId, @RequestBody Map<String, Object> body) {
        try {
            phieuChiDinhService.approveCdhaResult(detailId, body);
            return ResponseEntity.ok(Map.of("message", "Duyệt kết quả CĐHA thành công!"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }

    @PostMapping("/reject-cdha/{detailId}")
    public ResponseEntity<?> rejectCdhaResult(@PathVariable Integer detailId, @RequestBody Map<String, String> body) {
        try {
            phieuChiDinhService.rejectCdhaResult(detailId, body);
            return ResponseEntity.ok(Map.of("message", "Đã từ chối kết quả CĐHA"));
        } catch (Exception e) {
            e.printStackTrace();
            if (e.getMessage().contains("Vui lòng nhập")) return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }
}
