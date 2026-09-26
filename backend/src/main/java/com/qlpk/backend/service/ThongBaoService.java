package com.qlpk.backend.service;

import com.qlpk.backend.entity.ThongBao;

import java.util.List;

public interface ThongBaoService {

    ThongBao createThongBao(Integer maTaiKhoan, String loaiNguoiNhan, String tieuDe, String noiDung, String referenceType, String referenceId, Boolean daDoc);

    ThongBao createThongBao(Integer maTaiKhoan, String loaiNguoiNhan, String tieuDe, String noiDung, String referenceType, String referenceId, Boolean daDoc, Boolean sendFcm);

    ThongBao createThongBao(Integer maTaiKhoan, String loaiNguoiNhan, String tieuDe, String noiDung, String referenceType, String referenceId, String eventType, Boolean daDoc, Boolean sendFcm);

    ThongBao createThongBao(Integer maTaiKhoan, Integer maTaiKhoanNhanVien, String loaiNguoiNhan, String tieuDe, String noiDung, String referenceType, String referenceId, String eventType, Boolean daDoc, Boolean sendFcm);

    ThongBao createThongBaoNoDedup(Integer maTaiKhoan, String loaiNguoiNhan, String tieuDe, String noiDung, String referenceType, String referenceId, String eventType, Boolean daDoc, Boolean sendFcm);

    List<ThongBao> getThongBaoByUser(Integer maTaiKhoan, String loaiNguoiNhan, Boolean chiChuaDoc);

    long countUnread(Integer maTaiKhoan, String loaiNguoiNhan);

    ThongBao markAsRead(Long id);

    void markAllAsRead(Integer maTaiKhoan, String loaiNguoiNhan);

    void deleteThongBao(Long id);

    void deleteAllThongBao(Integer maTaiKhoan, String loaiNguoiNhan);

    List<ThongBao> getThongBaoByReferenceType(String referenceType);

    List<ThongBao> getThongBaoByReferenceTypeAndLoaiNguoiNhan(String referenceType, String loaiNguoiNhan);

    int sendPendingPushToUser(Integer maTaiKhoanBn);
}
