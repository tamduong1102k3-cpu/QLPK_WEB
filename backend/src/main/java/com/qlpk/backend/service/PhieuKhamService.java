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

    List<Map<String, Object>> getCompletedPatientsToday();
    List<Map<String, Object>> getCompletedPatientsTodayWithSearch(String keyword);
    List<Map<String, Object>> getHistoryByChuyenKhoaAllDays(Integer maChuyenKhoa);

    Map<String, Object> acceptClsPatient(Integer registrationId, Integer technicianId) throws Exception;

    Map<String, Object> confirmClsService(Integer maPhieuKham, Integer doctorId) throws Exception;

    Map<String, Object> techConfirmClsService(Integer maPhieuKham, Integer technicianId, String lyDoDen, String thongTinSangLoc, String ghiChu) throws Exception;

    List<Map<String, Object>> getPendingClsConfirmation(Integer maChuyenKhoa);

    List<Map<String, Object>> getHistoryByBenhNhan(Integer maBenhNhan, Integer maChuyenKhoa);
}
