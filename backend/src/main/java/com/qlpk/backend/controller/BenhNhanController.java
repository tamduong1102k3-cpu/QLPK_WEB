package com.qlpk.backend.controller;

import com.qlpk.backend.config.JwtUtils;
import com.qlpk.backend.dto.*;
import com.qlpk.backend.entity.BenhNhan;
import com.qlpk.backend.entity.KhamLamSang;
import com.qlpk.backend.entity.ChiSoKhamTongHop;
import com.qlpk.backend.entity.PhieuKham;
import com.qlpk.backend.entity.LichKham;
import com.qlpk.backend.repository.ChiSoKhamTongHopRepository;
import com.qlpk.backend.repository.PhieuKhamRepository;
import com.qlpk.backend.service.BenhNhanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/benh-nhan")
public class BenhNhanController {

    @Autowired private BenhNhanService service;
    @Autowired private JwtUtils jwtUtils;
    @Autowired private PhieuKhamRepository phieuKhamRepository;
    @Autowired private ChiSoKhamTongHopRepository chiSoKhamTongHopRepository;

    @GetMapping("/profile/ca-kham/{maPhieuKham}")
    public ResponseEntity<?> getChiTietCaKham(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @PathVariable Integer maPhieuKham) {
        ResponseEntity<?> validation = validateAndGetPhieuKham(authHeader, maPhieuKham);
        if (!validation.getStatusCode().is2xxSuccessful()) {
            return validation;
        }
        ChiTietCaKhamDTO result = service.getChiTietCaKham(maPhieuKham);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/profile/ca-kham/{maPhieuKham}/co-ban")
    public ResponseEntity<?> getCaKhamCoBan(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @PathVariable Integer maPhieuKham) {
        ResponseEntity<?> validation = validateAndGetPhieuKham(authHeader, maPhieuKham);
        if (!validation.getStatusCode().is2xxSuccessful()) {
            return validation;
        }
        ChiTietCaKhamCoBanDTO result = service.getChiTietCaKhamCoBan(maPhieuKham);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/profile/ca-kham/{maPhieuKham}/kham-lam-sang")
    public ResponseEntity<?> getCaKhamKhamLamSang(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @PathVariable Integer maPhieuKham) {
        ResponseEntity<?> validation = validateAndGetPhieuKham(authHeader, maPhieuKham);
        if (!validation.getStatusCode().is2xxSuccessful()) {
            return validation;
        }
        KhamLamSang result = service.getKhamLamSangByMaPhieuKham(maPhieuKham);
        return ResponseEntity.ok(result != null ? result : Map.of());
    }

    @GetMapping("/profile/ca-kham/{maPhieuKham}/chi-so-tong-hop")
    public ResponseEntity<?> getCaKhamChiSoTongHop(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @PathVariable Integer maPhieuKham) {
        ResponseEntity<?> validation = validateAndGetPhieuKham(authHeader, maPhieuKham);
        if (!validation.getStatusCode().is2xxSuccessful()) {
            return validation;
        }
        ChiSoKhamTongHop result = service.getChiSoKhamTongHopByMaPhieuKham(maPhieuKham);
        return ResponseEntity.ok(result != null ? result : Map.of());
    }

    @GetMapping("/profile/ca-kham/{maPhieuKham}/chi-so-tong-hop/all")
    public ResponseEntity<?> getCaKhamChiSoTongHopTatCa(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @PathVariable Integer maPhieuKham) {
        ResponseEntity<?> validation = validateAndGetPhieuKham(authHeader, maPhieuKham);
        if (!validation.getStatusCode().is2xxSuccessful()) {
            return validation;
        }
        List<ChiSoKhamTongHop> result = service.getAllChiSoKhamTongHopByMaPhieuKham(maPhieuKham);
        return ResponseEntity.ok(result != null ? result : List.of());
    }

    @GetMapping("/profile/ca-kham/{maPhieuKham}/hoa-don")
    public ResponseEntity<?> getCaKhamHoaDon(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @PathVariable Integer maPhieuKham) {
        ResponseEntity<?> validation = validateAndGetPhieuKham(authHeader, maPhieuKham);
        if (!validation.getStatusCode().is2xxSuccessful()) {
            return validation;
        }
        CaKhamHoaDonDTO result = service.getHoaDonByMaPhieuKham(maPhieuKham);
        return ResponseEntity.ok(result != null ? result : Map.of());
    }

    @GetMapping("/profile/ca-kham/{maPhieuKham}/lich-kham")
    public ResponseEntity<?> getCaKhamLichKham(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @PathVariable Integer maPhieuKham) {
        ResponseEntity<?> validation = validateAndGetPhieuKham(authHeader, maPhieuKham);
        if (!validation.getStatusCode().is2xxSuccessful()) {
            return validation;
        }
        List<LichKham> result = service.getLichTaiKhamByMaPhieuKham(maPhieuKham);
        return ResponseEntity.ok(result != null ? result : List.of());
    }

    @GetMapping("/profile/ca-kham/{maPhieuKham}/phieu-chi-dinh")
    public ResponseEntity<?> getCaKhamPhieuChiDinh(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @PathVariable Integer maPhieuKham) {
        ResponseEntity<?> validation = validateAndGetPhieuKham(authHeader, maPhieuKham);
        if (!validation.getStatusCode().is2xxSuccessful()) {
            return validation;
        }
        List<PhieuChiDinhChiTietDTO> result = service.getPhieuChiDinhByMaPhieuKham(maPhieuKham);
        return ResponseEntity.ok(result != null ? result : List.of());
    }

    @GetMapping("/profile/ca-kham/{maPhieuKham}/toa-thuoc")
    public ResponseEntity<?> getCaKhamToaThuoc(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @PathVariable Integer maPhieuKham) {
        ResponseEntity<?> validation = validateAndGetPhieuKham(authHeader, maPhieuKham);
        if (!validation.getStatusCode().is2xxSuccessful()) {
            return validation;
        }
        List<ToaThuocChiTietDTO> result = service.getToaThuocByMaPhieuKham(maPhieuKham);
        return ResponseEntity.ok(result != null ? result : List.of());
    }

    private ResponseEntity<?> validateAndGetPhieuKham(String authHeader, Integer maPhieuKham) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("message", "Thiếu token xác thực"));
        }
        String token = authHeader.substring(7);
        if (!jwtUtils.validateToken(token)) {
            return ResponseEntity.status(401).body(Map.of("message", "Token không hợp lệ hoặc đã hết hạn"));
        }
        Integer maBenhNhan = jwtUtils.getMaBenhNhanFromToken(token);
        if (maBenhNhan == null || maBenhNhan == 0) {
            return ResponseEntity.status(400).body(Map.of("message", "Token không chứa thông tin mã bệnh nhân"));
        }
        PhieuKham phieuKham = phieuKhamRepository.findById(maPhieuKham).orElse(null);
        if (phieuKham == null) {
            return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy phiếu khám"));
        }
        if (!phieuKham.getMaBenhNhan().equals(maBenhNhan)) {
            return ResponseEntity.status(403).body(Map.of("message", "Phiếu khám không thuộc về bệnh nhân này"));
        }
        return ResponseEntity.ok(phieuKham);
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfileFromToken(@RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("message", "Thiếu token xác thực"));
        }
        String token = authHeader.substring(7);
        if (!jwtUtils.validateToken(token)) {
            return ResponseEntity.status(401).body(Map.of("message", "Token không hợp lệ hoặc đã hết hạn"));
        }
        Integer maBenhNhan = jwtUtils.getMaBenhNhanFromToken(token);
        if (maBenhNhan == null || maBenhNhan == 0) {
            return ResponseEntity.status(400).body(Map.of("message", "Token không chứa thông tin mã bệnh nhân"));
        }
        BenhNhan benhNhan = service.getById(maBenhNhan);
        if (benhNhan == null) {
            return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy thông tin bệnh nhân"));
        }
        return ResponseEntity.ok(benhNhan);
    }

    @GetMapping("/profile/phieu-kham")
    public ResponseEntity<?> getPhieuKhamFromToken(@RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("message", "Thiếu token xác thực"));
        }
        String token = authHeader.substring(7);
        if (!jwtUtils.validateToken(token)) {
            return ResponseEntity.status(401).body(Map.of("message", "Token không hợp lệ hoặc đã hết hạn"));
        }
        Integer maBenhNhan = jwtUtils.getMaBenhNhanFromToken(token);
        if (maBenhNhan == null || maBenhNhan == 0) {
            return ResponseEntity.status(400).body(Map.of("message", "Token không chứa thông tin mã bệnh nhân"));
        }
        List<PhieuKhamDTO> result = service.getPhieuKhamListByBenhNhan(maBenhNhan);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/profile/phieu-kham/all")
    public ResponseEntity<?> getPhieuKhamFromTokenAllStatus(@RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("message", "Thiếu token xác thực"));
        }
        String token = authHeader.substring(7);
        if (!jwtUtils.validateToken(token)) {
            return ResponseEntity.status(401).body(Map.of("message", "Token không hợp lệ hoặc đã hết hạn"));
        }
        Integer maBenhNhan = jwtUtils.getMaBenhNhanFromToken(token);
        if (maBenhNhan == null || maBenhNhan == 0) {
            return ResponseEntity.status(400).body(Map.of("message", "Token không chứa thông tin mã bệnh nhân"));
        }
        List<PhieuKhamDTO> result = service.getPhieuKhamListByBenhNhanAllStatus(maBenhNhan);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/profile/hoa-don")
    public ResponseEntity<?> getHoaDonFromToken(@RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("message", "Thiếu token xác thực"));
        }
        String token = authHeader.substring(7);
        if (!jwtUtils.validateToken(token)) {
            return ResponseEntity.status(401).body(Map.of("message", "Token không hợp lệ hoặc đã hết hạn"));
        }
        Integer maBenhNhan = jwtUtils.getMaBenhNhanFromToken(token);
        if (maBenhNhan == null || maBenhNhan == 0) {
            return ResponseEntity.status(400).body(Map.of("message", "Token không chứa thông tin mã bệnh nhân"));
        }
        List<HoaDonBenhNhanDTO> result = service.getHoaDonListByBenhNhan(maBenhNhan);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/profile/toa-thuoc")
    public ResponseEntity<?> getToaThuocByBenhNhanFromToken(@RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("message", "Thiếu token xác thực"));
        }
        String token = authHeader.substring(7);
        if (!jwtUtils.validateToken(token)) {
            return ResponseEntity.status(401).body(Map.of("message", "Token không hợp lệ hoặc đã hết hạn"));
        }
        Integer maBenhNhan = jwtUtils.getMaBenhNhanFromToken(token);
        if (maBenhNhan == null || maBenhNhan == 0) {
            return ResponseEntity.status(400).body(Map.of("message", "Token không chứa thông tin mã bệnh nhân"));
        }
        List<ToaThuocChiTietDTO> result = service.getToaThuocByMaBenhNhan(maBenhNhan);
        return ResponseEntity.ok(result);
    }

    @GetMapping
    public List<BenhNhan> getAll() {
        return service.getAll();
    }

    @GetMapping("/search")
    public List<BenhNhan> search(@RequestParam String keyword) {
        return service.search(keyword);
    }

    @GetMapping("/find-flexible")
    public ResponseEntity<?> findFlexible(
            @RequestParam(required = false) String hoTen,
            @RequestParam(required = false) String soDienThoai,
            @RequestParam(required = false) String cccd) {

        String trimmedHoTen = hoTen != null ? hoTen.trim() : null;
        String trimmedSdt = soDienThoai != null ? soDienThoai.trim() : null;
        String trimmedCccd = cccd != null ? cccd.trim() : null;

        if (trimmedCccd != null && !trimmedCccd.isBlank()) {
            Optional<BenhNhan> result = service.findByCccd(trimmedCccd);
            if (result.isPresent()) {
                return ResponseEntity.ok(result.get());
            }
        }

        if ((trimmedHoTen != null && !trimmedHoTen.isBlank()) || 
            (trimmedSdt != null && !trimmedSdt.isBlank()) || 
            (trimmedCccd != null && !trimmedCccd.isBlank())) {
            List<BenhNhan> results = service.findFlexible(trimmedHoTen, trimmedSdt, trimmedCccd);
            if (results.size() == 1) {
                return ResponseEntity.ok(results.get(0));
            } else if (results.size() > 1) {
                return ResponseEntity.ok(results);
            }
        }

        return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy hồ sơ phù hợp"));
    }

    @GetMapping("/exact-match")
    public ResponseEntity<?> findExactMatch(
            @RequestParam String hoTen,
            @RequestParam String soDienThoai,
            @RequestParam String cccd) {
        Optional<BenhNhan> result = service.findExactMatch(hoTen.trim(), soDienThoai.trim(), cccd.trim());
        if (result.isPresent()) {
            return ResponseEntity.ok(result.get());
        }
        return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy hồ sơ phù hợp"));
    }

    @GetMapping("/{maBenhNhan}/vital-signs-latest")
    public ResponseEntity<?> getLatestVitalSigns(@PathVariable Integer maBenhNhan) {
        Optional<PhieuKham> phieuKhamOpt = phieuKhamRepository
                .findFirstByMaBenhNhanAndTrangThaiOrderByNgayKhamDesc(maBenhNhan, "HOAN_THANH");
        if (phieuKhamOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                "success", false,
                "message", "Không tìm thấy phiếu khám HOAN_THANH nào"
            ));
        }
        Integer maPhieuKham = phieuKhamOpt.get().getMaPhieuKham();
        Optional<ChiSoKhamTongHop> chiSoOpt = chiSoKhamTongHopRepository
                .findTopByMaPhieuKhamOrderByNgayTaoDesc(maPhieuKham);
        if (chiSoOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                "success", false,
                "message", "Không tìm thấy chỉ số khám cho phiếu #" + maPhieuKham
            ));
        }
        ChiSoKhamTongHop cs = chiSoOpt.get();
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", Map.of(
                "nhietDo", cs.getNhietDo(),
                "nhipTim", cs.getNhipTim(),
                "nhipTho", cs.getNhipTho(),
                "canNang", cs.getCanNang(),
                "chieuCao", cs.getChieuCao()
            )
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BenhNhan> getById(@PathVariable Integer id) {
        BenhNhan result = service.getById(id);
        if (result != null) return ResponseEntity.ok(result);
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/{id}/ho-so")
    public List<HoSoBenhNhanDTO> getHoSo(@PathVariable Integer id) {
        return service.getHoSo(id);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody BenhNhan benhNhan) {
        try {
            BenhNhan created = service.create(benhNhan);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            if (e.getMessage().contains("Số điện thoại") || e.getMessage().contains("CCCD") || e.getMessage().contains("Email")) {
                return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
            }
            return ResponseEntity.internalServerError().body(Map.of("message", "Lỗi cơ sở dữ liệu: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody BenhNhan body) {
        try {
            BenhNhan updated = service.update(id, body);
            if (updated != null) {
                return ResponseEntity.ok(updated);
            }
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Lỗi cơ sở dữ liệu: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        if (service.getById(id) == null) return ResponseEntity.notFound().build();
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
