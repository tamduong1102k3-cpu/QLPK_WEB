package com.qlpk.backend.controller;

import com.qlpk.backend.entity.*;
import com.qlpk.backend.repository.*;
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

        var kqxnOpt = ketQuaXetNghiemRepository.findByMaChiTietChiDinh(chiDinhId);
        if (kqxnOpt.isPresent()) {
            KetQuaXetNghiem kqxn = kqxnOpt.get();
            res.put("loaiDichVu", "XET_NGHIEM");
            res.put("ketLuan", kqxn.getKetLuan());

            res.put("noiDungKetQua", kqxn.getKetQua());

            res.put("chiTietKetQua", getChiTiet(kqxn.getId()));
            return ResponseEntity.ok(res);
        }

        var kqcdhaOpt = ketQuaCdhaRepository.findByIdChiTietChiDinh(chiDinhId);
        if (kqcdhaOpt.isPresent()) {
            KetQuaCdha kqcdha = kqcdhaOpt.get();
            res.put("loaiDichVu", "CDHA");
            res.put("ketLuan", kqcdha.getKetLuan());
            res.put("noiDungKetQua", kqcdha.getMoTaHinhAnh());
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
