package com.qlpk.backend.payment;

import com.qlpk.backend.entity.PhieuKham;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class WebSocketPublisher {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void publishPhieuKhamChange(String action, PhieuKham phieuKham) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("action", action); 
        payload.put("maPhieuKham", phieuKham.getMaPhieuKham());
        payload.put("trangThai", phieuKham.getTrangThai());
        payload.put("maBenhNhan", phieuKham.getMaBenhNhan());
        payload.put("maChuyenKhoa", phieuKham.getMaChuyenKhoa());
        messagingTemplate.convertAndSend("/topic/phieu-kham", payload);
    }

    public void publishPhieuKhamChange(String action, Integer maPhieuKham, String trangThai) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("action", action);
        payload.put("maPhieuKham", maPhieuKham);
        payload.put("trangThai", trangThai);
        messagingTemplate.convertAndSend("/topic/phieu-kham", payload);
    }

    public void publishDangKyKhamChange(String action, Integer maDangKy, String trangThai) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("action", action);
        payload.put("maDangKy", maDangKy);
        payload.put("trangThai", trangThai);
        messagingTemplate.convertAndSend("/topic/dang-ky-kham", payload);
    }

    public void publishVitalsChange(String action, Integer maPhieuKham) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("action", action);
        payload.put("maPhieuKham", maPhieuKham);
        messagingTemplate.convertAndSend("/topic/vitals", payload);
    }

    public void publishClsChange(String action, Integer maPhieuKham, String loai) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("action", action);
        payload.put("maPhieuKham", maPhieuKham);
        payload.put("loai", loai); 
        messagingTemplate.convertAndSend("/topic/cls", payload);
    }

    public void publishToaThuocChange(String action, Integer maPhieuKham) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("action", action);
        payload.put("maPhieuKham", maPhieuKham);
        messagingTemplate.convertAndSend("/topic/toa-thuoc", payload);
    }

    public void publishHoaDonChange(String action, Integer maHoaDon) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("action", action);
        payload.put("maHoaDon", maHoaDon);
        messagingTemplate.convertAndSend("/topic/hoa-don", payload);
    }

    public void publishKhoAlert(String action, Integer maThuoc, String tenThuoc, Integer soLuongTon, String trangThai) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("action", action);
        payload.put("maThuoc", maThuoc);
        payload.put("tenThuoc", tenThuoc);
        payload.put("soLuongTon", soLuongTon);
        payload.put("trangThai", trangThai);
        messagingTemplate.convertAndSend("/topic/kho-alert", payload);
    }

    public void publishKhoUpdate() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("action", "UPDATED");
        messagingTemplate.convertAndSend("/topic/kho-thuoc", payload);
    }

    public void publishLichKhamChange(String action, Integer maLichKham, String trangThai) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("action", action);
        payload.put("maLichKham", maLichKham);
        payload.put("trangThai", trangThai);
        messagingTemplate.convertAndSend("/topic/lich-kham", payload);
    }

    public void publishThongBaoEvent(Integer maTaiKhoan, String loaiNguoiNhan, String action, String tieuDe, String noiDung, Long id, String referenceType, String referenceId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("action", action);
        payload.put("id", id);
        payload.put("tieuDe", tieuDe);
        payload.put("noiDung", noiDung);
        payload.put("loaiNguoiNhan", loaiNguoiNhan);
        payload.put("maTaiKhoan", maTaiKhoan);
        payload.put("referenceType", referenceType);
        payload.put("referenceId", referenceId);
        messagingTemplate.convertAndSend("/topic/thong-bao/" + maTaiKhoan, payload);
    }
}
