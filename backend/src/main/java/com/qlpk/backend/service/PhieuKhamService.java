package com.qlpk.backend.service;

import com.qlpk.backend.dto.CheckInRequest;
import com.qlpk.backend.entity.PhieuKham;
import java.util.List;
import java.util.Map;

public interface PhieuKhamService {
    List<PhieuKham> getAll();
    PhieuKham getById(Integer id);
    PhieuKham create(PhieuKham entity);
    PhieuKham update(Integer id, PhieuKham entity);
    void delete(Integer id);

    List<PhieuKham> getToday();
    Map<String, Object> fullCheckIn(CheckInRequest request) throws Exception;
    Map<String, Object> acceptPatient(Integer registrationId, Integer assistantId) throws Exception;
    List<Map<String, Object>> getHistory(Integer maBacSi);
    void finishConsultation(Integer maPhieuKham) throws Exception;
    List<Map<String, Object>> getAssistantHistory(Integer maChuyenKhoa);
    void updateToWaitingForDoctor(Integer maPhieuKham) throws Exception;
    void updateToChoCls(Integer maPhieuKham) throws Exception;
    List<Map<String, Object>> getAvailableClsResults(Integer maPhieuKham);
    /** Lấy danh sách bệnh nhân đã hoàn thành khám hôm nay (cho thu ngân) */
    List<Map<String, Object>> getCompletedPatientsToday();
    List<Map<String, Object>> getCompletedPatientsTodayWithSearch(String keyword);
    List<Map<String, Object>> getHistoryByChuyenKhoaAllDays(Integer maChuyenKhoa);

    /**
     * KTV tiếp nhận bệnh nhân CLS: tạo PhieuKham, cập nhật trạng thái DangKyKhamBenh
     */
    Map<String, Object> acceptClsPatient(Integer registrationId, Integer technicianId) throws Exception;

    /**
     * Bác sĩ CLS xác nhận thực hiện dịch vụ: tạo PhieuChiDinh + ChiTietChiDinh
     */
    Map<String, Object> confirmClsService(Integer maPhieuKham, Integer doctorId) throws Exception;

    /**
     * Kỹ thuật viên xác nhận dịch vụ CLS: tạo TiepNhanCls + PhieuChiDinh + ChiTietChiDinh
     * Sau đó chuyển trạng thái lên CHO_CLS
     */
    Map<String, Object> techConfirmClsService(Integer maPhieuKham, Integer technicianId, String lyDoDen, String thongTinSangLoc, String ghiChu) throws Exception;

    /**
     * Lấy danh sách bệnh nhân CLS đang chờ bác sĩ xác nhận (đã có PhieuKham, chưa có PhieuChiDinh)
     */
    List<Map<String, Object>> getPendingClsConfirmation(Integer maChuyenKhoa);

    /**
     * Lấy lịch sử khám theo mã bệnh nhân, có thể lọc theo mã chuyên khoa
     */
    List<Map<String, Object>> getHistoryByBenhNhan(Integer maBenhNhan, Integer maChuyenKhoa);
}
