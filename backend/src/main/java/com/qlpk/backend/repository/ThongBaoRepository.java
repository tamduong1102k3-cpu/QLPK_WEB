package com.qlpk.backend.repository;

import com.qlpk.backend.entity.ThongBao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ThongBaoRepository extends JpaRepository<ThongBao, Long> {

    List<ThongBao> findByMaTaiKhoanAndLoaiNguoiNhanOrderByCreatedAtDesc(Integer maTaiKhoan, String loaiNguoiNhan);

    List<ThongBao> findByMaTaiKhoanAndLoaiNguoiNhanAndDaDocOrderByCreatedAtDesc(Integer maTaiKhoan, String loaiNguoiNhan, Boolean daDoc);

    // Lọc theo referenceType (vd: "HOA_DON")
    List<ThongBao> findByReferenceTypeOrderByCreatedAtDesc(String referenceType);

    // Lọc theo referenceType + loaiNguoiNhan (vd: chỉ lấy thông báo dành cho nhân viên)
    List<ThongBao> findByReferenceTypeAndLoaiNguoiNhanOrderByCreatedAtDesc(String referenceType, String loaiNguoiNhan);

    long countByMaTaiKhoanAndLoaiNguoiNhanAndDaDoc(Integer maTaiKhoan, String loaiNguoiNhan, Boolean daDoc);

    void deleteByMaTaiKhoanAndLoaiNguoiNhan(Integer maTaiKhoan, String loaiNguoiNhan);

    /**
     * Kiểm tra xem đã có thông báo chưa đọc (daDoc=false) cho cùng referenceType + referenceId + eventType chưa.
     * Dùng để tránh gửi FCM trùng lặp cho cùng một sự kiện của lịch hẹn / hóa đơn / ...
     */
    boolean existsByMaTaiKhoanAndLoaiNguoiNhanAndReferenceTypeAndReferenceIdAndEventTypeAndDaDoc(
        Integer maTaiKhoan, String loaiNguoiNhan, String referenceType, String referenceId, String eventType, Boolean daDoc);

    /**
     * Kiểm tra xem đã có ThongBao (không quan tâm daDoc) cho cùng referenceType + referenceId + eventType chưa.
     * Dùng để tránh tạo ThongBao trùng lặp trong NotificationScheduler.
     */
    boolean existsByMaTaiKhoanAndLoaiNguoiNhanAndReferenceTypeAndReferenceIdAndEventType(
        Integer maTaiKhoan, String loaiNguoiNhan, String referenceType, String referenceId, String eventType);

    /**
     * Kiểm tra đã có ThongBao cùng reference + eventType được tạo sau mốc thời gian cho trước chưa.
     * Dùng cho scheduler cảnh báo thuốc (dedupe theo ngày).
     */
    boolean existsByMaTaiKhoanAndLoaiNguoiNhanAndReferenceTypeAndReferenceIdAndEventTypeAndCreatedAtAfter(
        Integer maTaiKhoan, String loaiNguoiNhan, String referenceType,
        String referenceId, String eventType, LocalDateTime after);

    /**
     * Lấy danh sách thông báo CHƯA GỬI PUSH (daGuiPush = false) của một tài khoản.
     * Dùng để gửi push bù khi người dùng đăng ký FCM token lần đầu.
     */
    List<ThongBao> findByMaTaiKhoanAndLoaiNguoiNhanAndDaGuiPushFalseOrderByCreatedAtAsc(
        Integer maTaiKhoan, String loaiNguoiNhan);
}
