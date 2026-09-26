package com.qlpk.backend.controller;

import com.qlpk.backend.entity.ChiTietToaThuoc;
import com.qlpk.backend.entity.KhoThuoc;
import com.qlpk.backend.entity.ToaThuoc;
import com.qlpk.backend.entity.Thuoc;
import com.qlpk.backend.payment.WebSocketPublisher;
import com.qlpk.backend.repository.ChiTietToaThuocRepository;
import com.qlpk.backend.repository.KhoThuocRepository;
import com.qlpk.backend.repository.ThuocRepository;
import com.qlpk.backend.repository.ToaThuocRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/duoc-si")
public class DuocSiController {

    @Autowired
    private ToaThuocRepository toaThuocRepository;

    @Autowired
    private ChiTietToaThuocRepository chiTietToaThuocRepository;

    @Autowired
    private ThuocRepository thuocRepository;

    @Autowired
    private KhoThuocRepository khoThuocRepository;

    @Autowired
    private WebSocketPublisher webSocketPublisher;

    @GetMapping("/phieu-kham/{maPhieuKham}/toa-thuoc")
    public ResponseEntity<?> getToaThuocByPhieuKham(@PathVariable Integer maPhieuKham) {
        try {
            List<ToaThuoc> toaThuocList = toaThuocRepository.findActiveByMaPhieuKham(maPhieuKham);
            List<Map<String, Object>> result = new ArrayList<>();

            for (ToaThuoc toa : toaThuocList) {
                Map<String, Object> toaData = new HashMap<>();
                toaData.put("maToaThuoc", toa.getMaToaThuoc());
                toaData.put("ghiChu", toa.getGhiChu());
                toaData.put("ngayTao", toa.getNgayTao());
                toaData.put("trangThai", toa.getTrangThai());

                List<ChiTietToaThuoc> chiTietList = chiTietToaThuocRepository.findByMaToaThuoc(toa.getMaToaThuoc());
                List<Map<String, Object>> thuocDetails = new ArrayList<>();
                for (ChiTietToaThuoc ct : chiTietList) {
                    Map<String, Object> detail = new HashMap<>();
                    detail.put("id", ct.getId());
                    detail.put("maThuoc", ct.getMaThuoc());
                    detail.put("lieuDung", ct.getLieuDung());
                    detail.put("sang", ct.getSang());
                    detail.put("trua", ct.getTrua());
                    detail.put("chieu", ct.getChieu());
                    detail.put("toi", ct.getToi());
                    detail.put("soNgay", ct.getSoNgay());
                    detail.put("cachDung", ct.getCachDung());
                    detail.put("thoiDiemDung", ct.getThoiDiemDung());

                    Thuoc thuoc = thuocRepository.findById(ct.getMaThuoc()).orElse(null);
                    if (thuoc != null) {
                        detail.put("tenThuoc", thuoc.getTenThuoc());
                        detail.put("hamLuong", thuoc.getHamLuong());
                        detail.put("dangThuoc", thuoc.getDangThuoc());
                        detail.put("donViTinh", thuoc.getDonViTinh());
                        detail.put("hoatChat", thuoc.getHoatChat());

                        KhoThuoc kho = khoThuocRepository.findByMaThuoc(ct.getMaThuoc()).orElse(null);
                        Integer tonKho = (kho != null) ? kho.getSoLuongTon() : 0;

                        List<String> warnings = new ArrayList<>();

                        if (tonKho <= 0) {
                            warnings.add("Hết hàng");
                        }

                        if (thuoc.getHanSuDung() != null && thuoc.getHanSuDung().isBefore(LocalDate.now())) {
                            warnings.add("Hết hạn sử dụng: " + thuoc.getHanSuDung().toString());
                        } else if (thuoc.getHanSuDung() != null && thuoc.getHanSuDung().isBefore(LocalDate.now().plusMonths(1))) {
                            warnings.add("Sắp hết hạn: " + thuoc.getHanSuDung().toString());
                        }

                        if (!warnings.isEmpty()) {
                            detail.put("canhBao", String.join("; ", warnings));
                        }
                        detail.put("tonKho", tonKho);
                        detail.put("hanSuDung", thuoc.getHanSuDung() != null ? thuoc.getHanSuDung().toString() : null);
                    } else {
                        detail.put("tenThuoc", "Thuốc #" + ct.getMaThuoc());
                        detail.put("hamLuong", "");
                        detail.put("donViTinh", "");
                    }

                    thuocDetails.add(detail);
                }

                toaData.put("chiTietThuoc", thuocDetails);
                result.add(toaData);
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/toa-thuoc/{maToaThuoc}/xac-nhan-cap-thuoc")
    @Transactional
    public ResponseEntity<?> xacNhanCapThuoc(@PathVariable Integer maToaThuoc) {
        try {
            ToaThuoc toa = toaThuocRepository.findById(maToaThuoc)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy toa thuốc #" + maToaThuoc));

            if (!"CHO_CAP_THUOC".equals(toa.getTrangThai())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Toa thuốc #" + maToaThuoc + " không ở trạng thái CHO_CAP_THUOC (hiện tại: " + toa.getTrangThai() + "). Không thể cấp thuốc!"
                ));
            }

            List<ChiTietToaThuoc> chiTietList = chiTietToaThuocRepository.findByMaToaThuoc(maToaThuoc);
            List<Map<String, Object>> blockedItems = new ArrayList<>();

            for (ChiTietToaThuoc ct : chiTietList) {
                Thuoc thuoc = thuocRepository.findById(ct.getMaThuoc()).orElse(null);

                KhoThuoc kho = khoThuocRepository.findByMaThuocForUpdate(ct.getMaThuoc())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy kho cho thuốc #" + ct.getMaThuoc()));

                int soLuongCan = tinhSoLuongCanCap(ct);
                int soLuongTon = kho.getSoLuongTon() != null ? kho.getSoLuongTon() : 0;
                int soLuongDaGiu = kho.getSoLuongDaGiu() != null ? kho.getSoLuongDaGiu() : 0;
                String tenThuoc = (thuoc != null) ? thuoc.getTenThuoc() : "Thuốc #" + ct.getMaThuoc();

                List<String> lyDo = new ArrayList<>();

                if (soLuongTon <= 0) {
                    lyDo.add("hết hàng trong kho (tồn: " + soLuongTon + ")");
                }

                if (thuoc != null && thuoc.getHanSuDung() != null && thuoc.getHanSuDung().isBefore(LocalDate.now())) {
                    lyDo.add("đã hết hạn sử dụng (" + thuoc.getHanSuDung() + ")");
                }

                if (soLuongDaGiu < soLuongCan) {
                    lyDo.add("số lượng giữ (" + soLuongDaGiu + ") nhỏ hơn số lượng cần cấp (" + soLuongCan + ")");
                }

                if (!lyDo.isEmpty()) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("maThuoc", ct.getMaThuoc());
                    item.put("tenThuoc", tenThuoc);
                    item.put("soLuongTon", soLuongTon);
                    item.put("lyDo", String.join(", ", lyDo));
                    blockedItems.add(item);
                }
            }

            if (!blockedItems.isEmpty()) {

                for (Map<String, Object> bi : blockedItems) {
                    webSocketPublisher.publishKhoAlert(
                        "BLOCKED_CAP_THUOC",
                        (Integer) bi.get("maThuoc"),
                        (String) bi.get("tenThuoc"),
                        0,
                        "KHONG_THE_CAP"
                    );
                }

                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("blocked", blockedItems);
                errorResponse.put("error", "Không thể cấp thuốc do có " + blockedItems.size() + " loại thuốc không đủ điều kiện!");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            for (ChiTietToaThuoc ct : chiTietList) {
                int soLuongCan = tinhSoLuongCanCap(ct);

                KhoThuoc kho = khoThuocRepository.findByMaThuocForUpdate(ct.getMaThuoc())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy kho cho thuốc #" + ct.getMaThuoc()));

                kho.setSoLuongTon(kho.getSoLuongTon() - soLuongCan);

                kho.setSoLuongDaGiu(kho.getSoLuongDaGiu() - soLuongCan);
                kho.setNgayCapNhatCuoi(LocalDateTime.now());
                khoThuocRepository.save(kho);
            }

            webSocketPublisher.publishKhoUpdate();

            toaThuocRepository.updateTrangThaiDaCapThuoc(maToaThuoc);
            webSocketPublisher.publishToaThuocChange("DA_CAP_THUOC", toa.getMaPhieuKham());

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "✅ Đã cấp thuốc thành công cho toa #" + maToaThuoc,
                "maToaThuoc", maToaThuoc
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private int tinhSoLuongCanCap(ChiTietToaThuoc ct) {
        int lieu = 0;
        try { lieu += Integer.parseInt(ct.getSang()); } catch (Exception ignored) {}
        try { lieu += Integer.parseInt(ct.getTrua()); } catch (Exception ignored) {}
        try { lieu += Integer.parseInt(ct.getChieu()); } catch (Exception ignored) {}
        try { lieu += Integer.parseInt(ct.getToi()); } catch (Exception ignored) {}
        if (ct.getSoNgay() != null) lieu *= ct.getSoNgay();
        if (lieu <= 0) lieu = 1;
        return lieu;
    }
}
