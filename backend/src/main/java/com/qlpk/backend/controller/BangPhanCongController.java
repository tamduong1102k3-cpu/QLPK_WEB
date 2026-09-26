package com.qlpk.backend.controller;

import com.qlpk.backend.dto.BulkDefaultShiftRequest;
import com.qlpk.backend.dto.BulkDefaultShiftResult;
import com.qlpk.backend.dto.NhanCaMacDinhDenCuoiNamRequest;
import com.qlpk.backend.entity.BangPhanCongCaLam;
import com.qlpk.backend.service.BangPhanCongCaLamService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/phan-cong")
public class BangPhanCongController {

    private static final Logger log = LoggerFactory.getLogger(BangPhanCongController.class);

    @Autowired
    private BangPhanCongCaLamService service;

    @GetMapping
    public ResponseEntity<List<BangPhanCongCaLam>> getAll() {
        try {
            return ResponseEntity.ok(service.getAll());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody BangPhanCongCaLam entity) {
        try {
            BangPhanCongCaLam created = service.create(entity);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Không thể tạo ca làm việc"));
        }
    }

    @PostMapping("/default-month")
    public ResponseEntity<?> createDefaultInMonth(@RequestBody BulkDefaultShiftRequest request) {
        try {
            List<BangPhanCongCaLam> created = service.createDefaultInMonth(request);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Không thể tạo ca mặc định cho tháng"));
        }
    }

    @PostMapping("/nhan-ca-mac-dinh-den-cuoi-nam")
    public ResponseEntity<?> nhanCaMacDinhDenCuoiNam(
            @RequestBody NhanCaMacDinhDenCuoiNamRequest request) {
        try {
            BulkDefaultShiftResult result = service.nhanCaMacDinhDenCuoiNam(request);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(400).body(Map.of(
                    "message",
                    e.getMessage() != null
                            ? e.getMessage()
                            : "Không thể nhân ca mặc định đến cuối năm"
            ));
        }
    }

    @PutMapping("/default-month")
    public ResponseEntity<?> updateDefaultInMonth(@RequestBody BulkDefaultShiftRequest request) {
        try {
            List<BangPhanCongCaLam> updated = service.updateDefaultInMonth(request);
            return ResponseEntity.ok(Map.of(
                    "updated", updated,
                    "count", updated != null ? updated.size() : 0,
                    "message", "Đã cập nhật " + (updated != null ? updated.size() : 0) + " ca mặc định theo thứ trong tháng"
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Không thể cập nhật ca mặc định hàng loạt"));
        }
    }

    @DeleteMapping("/default-month")
    public ResponseEntity<?> deleteDefaultByWeekday(
            @RequestParam Integer maNhanVien,
            @RequestParam Integer nam,
            @RequestParam Integer thang,
            @RequestParam String thu) {
        try {
            int deleted = service.deleteDefaultByWeekday(maNhanVien, nam, thang, thu);
            return ResponseEntity.ok(Map.of("deleted", deleted, "message", "Đã xóa ca làm việc mặc định theo thứ trong tháng"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Không thể xóa ca mặc định theo thứ trong tháng"));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody BangPhanCongCaLam entity) {
        try {
            BangPhanCongCaLam updated = service.update(id, entity);
            if (updated == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Không thể cập nhật ca làm việc"));
        }
    }

    @PutMapping("/{id}/nghi-phep")
    public ResponseEntity<?> updateNghiPhep(@PathVariable Integer id, @RequestBody Map<String, String> body) {
        try {
            String lyDo = body != null ? body.get("lyDo") : null;
            BangPhanCongCaLam phanCong = service.updateNghiPhep(id, lyDo); 

            try {
                service.xuLyNghiDotXuat(phanCong.getMaNhanVien(), phanCong.getNgay(), lyDo);
            } catch (Exception ex) {
                log.error("Xử lý hủy hàng loạt thất bại cho bác sĩ {} ngày {}: {}",
                    phanCong.getMaNhanVien(), phanCong.getNgay(), ex.getMessage(), ex);
            }

            return ResponseEntity.ok(phanCong);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Không thể cập nhật nghỉ phép"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        try {
            service.delete(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/working-today")
    public ResponseEntity<List<BangPhanCongCaLam>> getWorkingToday() {
        try {
            List<BangPhanCongCaLam> shifts = service.getWorkingToday();
            return ResponseEntity.ok(shifts != null ? shifts : Collections.emptyList());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Collections.emptyList());
        }
    }

    @GetMapping("/current-room/{maNhanVien}")
    public ResponseEntity<?> getCurrentRoom(@PathVariable Integer maNhanVien) {
        try {
            Map<String, Object> response = service.getCurrentRoom(maNhanVien);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi server: " + e.getMessage()));
        }
    }

    @GetMapping("/phong-theo-bac-si")
    public ResponseEntity<?> getPhongTheoBacSi(
            @RequestParam Integer maBacSi,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate ngay) {
        try {
            Map<String, Object> response = service.getPhongTheoBacSi(maBacSi, ngay);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Không thể lấy phòng theo bác sĩ"));
        }
    }

    @GetMapping("/by-nhan-vien/{maNhanVien}")
    public ResponseEntity<List<BangPhanCongCaLam>> getByNhanVien(@PathVariable Integer maNhanVien) {
        try {
            List<BangPhanCongCaLam> list = service.getByMaNhanVien(maNhanVien);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Collections.emptyList());
        }
    }
}
