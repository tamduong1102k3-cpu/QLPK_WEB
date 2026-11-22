package com.qlpk.backend.service;

import com.qlpk.backend.entity.LichKham;
import com.qlpk.backend.entity.NguonTao;

import java.time.LocalDate;
import java.util.List;

public interface LichKhamService {
    List<LichKham> getAll();
    LichKham getById(Integer id);

    /**
     * Tạo lich_kham mới.
     *
     * @param entity               Dữ liệu lịch khám cần tạo
     * @param maNhanVienThucHien   Mã nhân viên thực hiện (lấy từ JWT, không nhận từ client).
     *                             Có thể null khi bệnh nhân tự đặt lịch qua App — khi đó KHÔNG ghi audit.
     */
    LichKham create(LichKham entity, Integer maNhanVienThucHien);

    /**
     * Cập nhật lich_kham.
     *
     * @param id                   Mã lịch khám
     * @param entity               Dữ liệu mới
     * @param maNhanVienThucHien   Mã nhân viên thực hiện (lấy từ JWT, không nhận từ client)
     */
    LichKham update(Integer id, LichKham entity, Integer maNhanVienThucHien);

    void delete(Integer id);

    List<LichKham> getByBenhNhan(Integer maBenhNhan);
    List<LichKham> getByBacSi(Integer maBacSi);
    List<LichKham> getByNgayKham(LocalDate ngayKham);
    List<LichKham> getByChuyenKhoa(Integer maChuyenKhoa);

    List<LichKham> getByNguonTao(NguonTao nguonTao);
    List<LichKham> getByTrangThai(String trangThai);
    List<LichKham> getAppointmentsByDate(LocalDate ngayKham);
    List<LichKham> getAppointmentsByDoctorAndDate(Integer maBacSi, LocalDate ngayKham);
    List<LichKham> getAppointmentsBetweenDates(LocalDate startDate, LocalDate endDate);
    LichKham updateTrangThai(Integer id, String trangThai);

    List<LichKham> searchAppointments(String trangThai, Integer maChuyenKhoa, Integer maDichVu, LocalDate ngayKham);

    List<LichKham> searchAppointmentsByKeyword(String trangThai, NguonTao nguonTao, String keyword);

    /**
     * Đếm số lần vắng mặt (quá hẹn) tích lũy trong tháng của bệnh nhân.
     * Nguồn dữ liệu: cột benh_nhan.so_lan_qua_hen — do SoLanQuaHenScheduler cập nhật,
     * reset về 0 vào 00:00 ngày 1 mỗi tháng.
     */
    int demSoLanQuaHen(Integer maBenhNhan);

    boolean canBookAppointment(Integer maBenhNhan);

    boolean hasActiveAppointment(Integer maBenhNhan);

    /**
     * Kiểm tra trùng lịch hẹn: cùng bệnh nhân, cùng ngày khám, cùng ca khám.
     * 
  
     * 
     * @param maBenhNhan Mã bệnh nhân
     * @param ngayKham   Ngày khám
     * @param maCa       Mã ca khám (null → fail-open, trả false)
     * @return true nếu đã có lịch trùng ngày + ca
     */
    boolean isDuplicateDateTime(Integer maBenhNhan, LocalDate ngayKham, Integer maCa);

    /**
     * Hủy lịch hẹn có điều kiện atomic — dùng chung cho bác sĩ/lễ tân hủy lịch.
     * Chỉ hủy nếu lịch đang ở trạng thái CHUA_DEN 
     * khi lịch đã bị job QUA_HEN xử lý trước, hoặc đã bị hủy từ trước.
     *
     * @param id                   Mã lịch khám cần hủy
     * @param maNhanVienThucHien   Mã nhân viên thực hiện (lấy từ JWT, không nhận từ client)
     * @param lyDo                 Lý do hủy (nullable — lưu vào ly_do_hoan để app hiển thị; null thì giữ nguyên)
     * @return Lịch khám đã được hủy (trạng thái HUY)
     * @throws RuntimeException nếu lịch không còn ở trạng thái CHUA_DEN
     */
    LichKham huyLich(Integer id, Integer maNhanVienThucHien, String lyDo);

    /**
     * Hoãn lịch hẹn (bác sĩ/lễ tân hoãn lịch khám) — hủy lịch cũ (HOAN) + tạo lịch mới.
     *
  
     *
     * @param maLichKhamCu         Mã lịch hẹn CŨ cần hủy (chuyển sang HOAN, giữ ngay_kham để truy vết)
     * @param lichMoi              Thông tin lịch MỚI (có thể set ngayKham, maCa, maBacSi, maPhong, maDichVu, maChuyenKhoa — các field null sẽ copy từ lịch cũ)
     * @param lyDo                 Lý do hoãn (bắt buộc, lưu vào cột ly_do_hoan riêng — KHÔNG append vào ghiChu)
     * @param maNhanVienThucHien   Mã nhân viên thực hiện (lấy từ JWT, không nhận từ client)
     * @return Lịch khám MỚI đã được tạo (trạng thái CHUA_DEN)
     * @throws RuntimeException nếu lịch cũ không còn CHUA_DEN, ngày mới ở quá khứ hoặc hôm nay,
     *                          bác sĩ không làm việc ngày mới, hoặc đã bị xử lý bởi luồng khác
     */
    LichKham hoanLich(Integer maLichKhamCu, LichKham lichMoi, String lyDo, Integer maNhanVienThucHien);
}