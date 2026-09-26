package com.qlpk.backend.service;

import com.qlpk.backend.entity.LichKham;
import com.qlpk.backend.entity.NguonTao;

import java.time.LocalDate;
import java.util.List;

public interface LichKhamService {
    List<LichKham> getAll();
    LichKham getById(Integer id);

    LichKham create(LichKham entity, Integer maNhanVienThucHien);

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

    int countCancellationsLast30Days(Integer maBenhNhan);

    boolean canBookAppointment(Integer maBenhNhan);

    boolean hasActiveAppointment(Integer maBenhNhan);

    boolean isDuplicateDateTime(Integer maBenhNhan, LocalDate ngayKham, Integer maCa);

    LichKham huyLich(Integer id, Integer maNhanVienThucHien);

    LichKham hoanLich(Integer maLichKhamCu, LichKham lichMoi, String lyDo, Integer maNhanVienThucHien);
}
