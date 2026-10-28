package com.qlpk.backend.payment;

import com.qlpk.backend.entity.PhieuKham;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Service chung để publish các sự kiện WebSocket cho danh sách bệnh nhân
 * ở các role khác nhau (lễ tân, trợ lý, bác sĩ, kỹ thuật viên, dược sĩ, thu ngân).
 */
@Service
public class WebSocketPublisher {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Publish sự kiện tạo/cập nhật phiếu khám (áp dụng cho lễ tân, trợ lý, bác sĩ).
     */
    public void publishPhieuKhamChange(String action, PhieuKham phieuKham) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("action", action); 
        payload.put("maPhieuKham", phieuKham.getMaPhieuKham());
        payload.put("trangThai", phieuKham.getTrangThai());
        payload.put("maBenhNhan", phieuKham.getMaBenhNhan());
        payload.put("maChuyenKhoa", phieuKham.getMaChuyenKhoa());
        messagingTemplate.convertAndSend("/topic/phieu-kham", payload);
    }

    /**
     * Publish sự kiện phiếu khám với payload tùy biến.
     */
    public void publishPhieuKhamChange(String action, Integer maPhieuKham, String trangThai) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("action", action);
        payload.put("maPhieuKham", maPhieuKham);
        payload.put("trangThai", trangThai);
        messagingTemplate.convertAndSend("/topic/phieu-kham", payload);
    }

    /**
     * Publish sự kiện thay đổi trạng thái đăng ký khám (lễ tân).
     */
    public void publishDangKyKhamChange(String action, Integer maDangKy, String trangThai) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("action", action);
        payload.put("maDangKy", maDangKy);
        payload.put("trangThai", trangThai);
        messagingTemplate.convertAndSend("/topic/dang-ky-kham", payload);
    }

    /**
     * Publish sự kiện liên quan đến sinh hiệu / khám sơ bộ (trợ lý).
     */
    public void publishVitalsChange(String action, Integer maPhieuKham) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("action", action);
        payload.put("maPhieuKham", maPhieuKham);
        messagingTemplate.convertAndSend("/topic/vitals", payload);
    }

    /**
     * Publish sự kiện liên quan đến kết quả CLS / xét nghiệm / CĐHA (kỹ thuật viên, bác sĩ).
     */
    public void publishClsChange(String action, Integer maPhieuKham, String loai) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("action", action);
        payload.put("maPhieuKham", maPhieuKham);
        payload.put("loai", loai); // XET_NGHIEM, CDHA
        messagingTemplate.convertAndSend("/topic/cls", payload);
    }

    /**
     * Publish sự kiện liên quan đến toa thuốc (dược sĩ, bác sĩ).
     */
    public void publishToaThuocChange(String action, Integer maPhieuKham) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("action", action);
        payload.put("maPhieuKham", maPhieuKham);
        messagingTemplate.convertAndSend("/topic/toa-thuoc", payload);
    }

    /**
     * Publish sự kiện liên quan đến hóa đơn (thu ngân).
     */
    public void publishHoaDonChange(String action, Integer maHoaDon) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("action", action);
        payload.put("maHoaDon", maHoaDon);
        messagingTemplate.convertAndSend("/topic/hoa-don", payload);
    }

    /**
     * Publish sự kiện cảnh báo tồn kho (nhân viên kho).
     */
    public void publishKhoAlert(String action, Integer maThuoc, String tenThuoc, Integer soLuongTon, String trangThai) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("action", action);
        payload.put("maThuoc", maThuoc);
        payload.put("tenThuoc", tenThuoc);
        payload.put("soLuongTon", soLuongTon);
        payload.put("trangThai", trangThai);
        messagingTemplate.convertAndSend("/topic/kho-alert", payload);
    }

    /**
     * Publish sự kiện cập nhật tồn kho.
     */
    public void publishKhoUpdate() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("action", "UPDATED");
        messagingTemplate.convertAndSend("/topic/kho-thuoc", payload);
    }

    /**
     * Publish sự kiện thay đổi trạng thái lịch khám.
     */
    public void publishLichKhamChange(String action, Integer maLichKham, String trangThai) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("action", action);
        payload.put("maLichKham", maLichKham);
        payload.put("trangThai", trangThai);
        messagingTemplate.convertAndSend("/topic/lich-kham", payload);
    }

    /**
     * Publish sự kiện thông báo mới.
     * Client sẽ subscribe theo /topic/thong-bao/{maTaiKhoan}
     */
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
