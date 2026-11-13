package com.qlpk.backend.controller;

import com.qlpk.backend.entity.HinhAnhKetQuaCdha;
import com.qlpk.backend.entity.*;
import com.qlpk.backend.repository.*;
import com.qlpk.backend.service.ClsResultAuthorizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;
import java.util.List;

@RestController
@RequestMapping("/api/ket-qua-cls")
public class KetQuaClsController {

    @Autowired
    private ChiTietChiDinhRepository chiTietRepository;

    @Autowired
    private DichVuRepository dichVuRepository;

    @Autowired
    private KetQuaXetNghiemRepository ketQuaXetNghiemRepository;

    @Autowired
    private KetQuaCdhaRepository ketQuaCdhaRepository;

    @Autowired
    private ChiTietKetQuaXnRepository chiTietKetQuaXnRepository;

    @Autowired
    private ChiTietXetNghiemRepository chiTietXetNghiemRepository;

    @Autowired
    private HinhAnhKetQuaCdhaRepository hinhAnhKetQuaCdhaRepository;

    @Autowired
    private NhanVienRepository nhanVienRepository;

    @Autowired
    private ClsResultAuthorizationService clsResultAuthorizationService;

    @GetMapping("/{chiDinhId}")
    public ResponseEntity<?> getDetail(@PathVariable Integer chiDinhId) {
        var detailOpt = chiTietRepository.findById(chiDinhId);
        if (detailOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy chi tiết chỉ định #" + chiDinhId));
        }
        ChiTietChiDinh detail = detailOpt.get();
        String tenDv = dichVuRepository.findById(detail.getMaDichVu())
                .map(DichVu::getTenDichVu).orElse("Dịch vụ cận lâm sàng");

        Map<String, Object> res = new HashMap<>();
        res.put("chiDinhId", chiDinhId);
        res.put("tenDichVu", tenDv);

        var kqxnOpt = ketQuaXetNghiemRepository
                .findFirstByMaChiTietChiDinhOrderByNgayThucHienDescIdDesc(chiDinhId);
        if (kqxnOpt.isPresent()) {
            KetQuaXetNghiem kqxn = kqxnOpt.get();
            NhanVien doctor = clsResultAuthorizationService.getClsDoctorIfAuthenticated();
            if (doctor != null && "CHO_DUYET".equals(kqxn.getTrangThai())) {
                clsResultAuthorizationService.requireAuthorizedClsDetail(
                        chiDinhId, doctor, "CLS_XET_NGHIEM");
                clsResultAuthorizationService.requireDoctorOwnsPendingResult(
                        doctor.getMaNhanVien(), kqxn.getTrangThai(), kqxn.getMaBsKetLuan());
            }
            res.put("loaiDichVu", "XET_NGHIEM");
            res.put("ngayThucHien", kqxn.getNgayThucHien());
            res.put("nguoiThucHien", kqxn.getNguoiThucHien());
            if (kqxn.getNguoiThucHien() != null) {
                nhanVienRepository.findById(kqxn.getNguoiThucHien())
                        .ifPresent(nv -> res.put("tenNguoiThucHien", nv.getHoTen()));
            }
            res.put("maBsKetLuan", kqxn.getMaBsKetLuan());
            if (kqxn.getMaBsKetLuan() != null) {
                nhanVienRepository.findById(kqxn.getMaBsKetLuan())
                        .ifPresent(nv -> res.put("tenBsKetLuan", nv.getHoTen()));
            }
            res.put("trangThai", kqxn.getTrangThai());
            res.put("ketLuan", kqxn.getKetLuan());
            res.put("ghiChuThem", kqxn.getGhiChuThem());
            // nội dung gộp 1 cột ket_qua
            res.put("noiDungKetQua", kqxn.getKetQua());
            // chỉ số chi tiết ở bảng chi_tiet_ket_qua_xn
            res.put("chiTietKetQua", getChiTiet(kqxn.getId()));
            return ResponseEntity.ok(res);
        }

        var kqcdhaOpt = ketQuaCdhaRepository
                .findFirstByIdChiTietChiDinhOrderByNgayThucHienDescIdDesc(chiDinhId);
        if (kqcdhaOpt.isPresent()) {
            KetQuaCdha kqcdha = kqcdhaOpt.get();
            NhanVien doctor = clsResultAuthorizationService.getClsDoctorIfAuthenticated();
            if (doctor != null && "CHO_DUYET".equals(kqcdha.getTrangThai())) {
                clsResultAuthorizationService.requireAuthorizedClsDetail(
                        chiDinhId, doctor, "CLS_CHAN_DOAN_HINH_ANH");
                clsResultAuthorizationService.requireDoctorOwnsPendingResult(
                        doctor.getMaNhanVien(), kqcdha.getTrangThai(), kqcdha.getMaBacSiThucHien());
            }
            res.put("loaiDichVu", "CDHA");
            res.put("ketLuan", kqcdha.getKetLuan());
            res.put("noiDungKetQua", kqcdha.getMoTaHinhAnh());
            // Gallery N ảnh từ bảng mới (backward-compat 2 field cũ)
            java.util.List<String> urls = hinhAnhKetQuaCdhaRepository
                    .findByMaKetQuaCdhaOrderByThuTuAsc(kqcdha.getId())
                    .stream().map(HinhAnhKetQuaCdha::getDuongDanAnh)
                    .filter(u -> u != null && !u.trim().isEmpty()).toList();
            res.put("duongDanAnh1", urls.size() > 0 ? urls.get(0) : null);
            res.put("duongDanAnh2", urls.size() > 1 ? urls.get(1) : null);
            res.put("danhSachAnh", urls);
            return ResponseEntity.ok(res);
        }

        return ResponseEntity.status(404).body(Map.of("message", "Chưa có kết quả đã duyệt cho chỉ định #" + chiDinhId));
    }

    private List<Map<String, Object>> getChiTiet(Integer maKetQuaXn) {
        List<Map<String, Object>> result = new java.util.ArrayList<>();
        for (ChiTietKetQuaXn ct : chiTietKetQuaXnRepository.findByMaKetQuaXn(maKetQuaXn)) {
            Map<String, Object> m = new HashMap<>();
            m.put("maChiSo", ct.getMaChiSo());
            m.put("giaTri", ct.getGiaTri());
            m.put("ghiChu", ct.getGhiChu());
            chiTietXetNghiemRepository.findById(ct.getMaChiSo()).ifPresent(cs -> {
                m.put("tenChiSo", cs.getTenChiSo());
                m.put("donVi", cs.getDonVi());
                m.put("giaTriBinhThuong", cs.getGiaTriBinhThuong());
            });
            result.add(m);
        }
        return result;
    }
}