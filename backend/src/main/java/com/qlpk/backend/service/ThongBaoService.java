package com.qlpk.backend.service;

import com.qlpk.backend.entity.ThongBao;

import java.util.List;

public interface ThongBaoService {

    /**
     * Tạo thông báo (mặc định eventType = SYSTEM_NOTIFICATION, sendFcm = true).
     */
    ThongBao createThongBao(Integer maTaiKhoan, String loaiNguoiNhan, String tieuDe, String noiDung, String referenceType, String referenceId, Boolean daDoc);

    /**
     * Tạo thông báo với tùy chọn gửi FCM (mặc định eventType = SYSTEM_NOTIFICATION).
     * @param sendFcm true = gửi FCM, false = chỉ lưu DB + WebSocket
     */
    ThongBao createThongBao(Integer maTaiKhoan, String loaiNguoiNhan, String tieuDe, String noiDung, String referenceType, String referenceId, Boolean daDoc, Boolean sendFcm);

    /**
     * Tạo thông báo với eventType và tùy chọn gửi FCM (sendFcm).
     * @param eventType Loại sự kiện (LICH_KHAM_CREATED, PAYMENT_SUCCESS, ...). Có thể null.
     * @param sendFcm true = gửi FCM, false = chỉ lưu DB + WebSocket
     */
    ThongBao createThongBao(Integer maTaiKhoan, String loaiNguoiNhan, String tieuDe, String noiDung, String referenceType, String referenceId, String eventType, Boolean daDoc, Boolean sendFcm);

    /**
     * Tạo thông báo với eventType, tùy chọn gửi FCM và maTaiKhoan riêng cho bản nhân viên.
     * @param maTaiKhoan ma_tai_khoan của bệnh nhân (bảng tai_khoan_benh_nhan)
     * @param maTaiKhoanNhanVien ma_tai_khoan của nhân viên (bảng tai_khoan) dùng cho bản NHAN_VIEN
     */
    ThongBao createThongBao(Integer maTaiKhoan, Integer maTaiKhoanNhanVien, String loaiNguoiNhan, String tieuDe, String noiDung, String referenceType, String referenceId, String eventType, Boolean daDoc, Boolean sendFcm);

    /**
     * Tạo thông báo KHÔNG kiểm tra trùng lặp (bỏ qua anti-dedup check).
     * Dùng khi cần gửi nhiều thông báo cùng referenceType + referenceId + eventType
     * (vd: cập nhật lịch khám nhiều lần, mỗi lần phải gửi thông báo mới).
     * @param maTaiKhoan ma_tai_khoan của bệnh nhân
     * @param loaiNguoiNhan "BENH_NHAN" hoặc "NHAN_VIEN"
     * @param tieuDe Tiêu đề thông báo
     * @param noiDung Nội dung thông báo
     * @param referenceType Loại đối tượng tham chiếu (vd: "LICH_KHAM")
     * @param referenceId ID đối tượng tham chiếu
     * @param eventType Loại sự kiện
     * @param daDoc Đã đọc chưa
     * @param sendFcm true = gửi FCM, false = chỉ lưu DB + WebSocket
     */
    ThongBao createThongBaoNoDedup(Integer maTaiKhoan, String loaiNguoiNhan, String tieuDe, String noiDung, String referenceType, String referenceId, String eventType, Boolean daDoc, Boolean sendFcm);

    /**
     * Tao thong bao CHI cho benh nhan - KHONG tao ban nhan vien.
     * Dung cho flow bac si tu tao lich (khong can thong bao chinh minh).
     */
    ThongBao createThongBaoChoBenhNhan(Integer maTaiKhoanBn, String tieuDe, String noiDung, String referenceType, String referenceId, String eventType, Boolean daDoc, Boolean sendFcm);

    List<ThongBao> getThongBaoByUser(Integer maTaiKhoan, String loaiNguoiNhan, Boolean chiChuaDoc);

    long countUnread(Integer maTaiKhoan, String loaiNguoiNhan);

    ThongBao markAsRead(Long id);

    ThongBao markAsRead(Long id, Integer ownerId);

    void markAllAsRead(Integer maTaiKhoan, String loaiNguoiNhan);

    void deleteThongBao(Long id);

    void deleteThongBao(Long id, Integer ownerId);

    void deleteAllThongBao(Integer maTaiKhoan, String loaiNguoiNhan);

    List<ThongBao> getThongBaoByReferenceType(String referenceType);

    /** Lấy thông báo theo referenceType + loaiNguoiNhan (vd: chỉ thông báo cho nhân viên) */
    List<ThongBao> getThongBaoByReferenceTypeAndLoaiNguoiNhan(String referenceType, String loaiNguoiNhan);

    /**
     * Gửi push bù cho tất cả thông báo CHƯA GỬI push (daGuiPush = false) của một bệnh nhân,
     * sau đó cập nhật daGuiPush = true. Gọi sau khi người dùng đăng ký FCM token lần đầu.
     */
    int sendPendingPushToUser(Integer maTaiKhoanBn);
}
