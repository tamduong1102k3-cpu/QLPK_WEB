package com.qlpk.backend.service;

import com.qlpk.backend.dto.ReferralRequest;
import com.qlpk.backend.entity.ChiTietChiDinh;
import com.qlpk.backend.entity.PhieuChiDinh;
import java.util.List;
import java.util.Map;

public interface PhieuChiDinhService {
    List<PhieuChiDinh> getAll();
    PhieuChiDinh getById(Integer id);
    PhieuChiDinh create(PhieuChiDinh entity);
    PhieuChiDinh update(Integer id, PhieuChiDinh entity);
    void delete(Integer id);

    List<Map<String, Object>> getPendingTests(Integer maChuyenKhoa);
    List<Map<String, Object>> getCompletedTestsToday(Integer maChuyenKhoa);
    void submitTestResult(Map<String, Object> body) throws Exception;
    PhieuChiDinh create(ReferralRequest request) throws Exception;
    List<PhieuChiDinh> getByPhieuKham(Integer maPhieuKham);
    List<PhieuChiDinh> getByBenhNhan(Integer maBenhNhan);
    List<ChiTietChiDinh> getDetails(Integer id);
    
    Object getCdhaResult(Integer detailId);
    Object getXetNhiemResult(Integer detailId);
    List<Map<String, Object>> getXetNhiemResultsByPhieuKham(Integer maPhieuKham);
    void approveTestResult(Integer id, Map<String, Object> body) throws Exception;
    List<Map<String, Object>> getApprovedHistory(Integer maBacSi);
    void rejectTestResult(Integer id, Map<String, String> body) throws Exception;
    
    List<Map<String, Object>> getCdhaResultsByPhieuKham(Integer maPhieuKham);
    void approveCdhaResult(Integer detailId, Map<String, Object> body) throws Exception;
    void rejectCdhaResult(Integer detailId, Map<String, String> body) throws Exception;

    /** Lấy danh sách kết quả chờ duyệt theo chuyên khoa (cho bác sĩ chẩn đoán/xét nghiệm) */
    List<Map<String, Object>> getPendingApprovalList(Integer maChuyenKhoa);
    /** Lấy danh sách kết quả đã duyệt theo chuyên khoa (cho bác sĩ chẩn đoán/xét nghiệm) */
    List<Map<String, Object>> getApprovedList(Integer maChuyenKhoa);
}