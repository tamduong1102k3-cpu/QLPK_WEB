package com.qlpk.backend.repository;

import com.qlpk.backend.entity.ThongBao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ThongBaoRepository extends JpaRepository<ThongBao, Long> {

    List<ThongBao> findByMaTaiKhoanAndLoaiNguoiNhanOrderByCreatedAtDesc(Integer maTaiKhoan, String loaiNguoiNhan);

    List<ThongBao> findByMaTaiKhoanAndLoaiNguoiNhanAndDaDocOrderByCreatedAtDesc(Integer maTaiKhoan, String loaiNguoiNhan, Boolean daDoc);

    List<ThongBao> findByReferenceTypeOrderByCreatedAtDesc(String referenceType);

    List<ThongBao> findByReferenceTypeAndLoaiNguoiNhanOrderByCreatedAtDesc(String referenceType, String loaiNguoiNhan);

    long countByMaTaiKhoanAndLoaiNguoiNhanAndDaDoc(Integer maTaiKhoan, String loaiNguoiNhan, Boolean daDoc);

    void deleteByMaTaiKhoanAndLoaiNguoiNhan(Integer maTaiKhoan, String loaiNguoiNhan);

    boolean existsByMaTaiKhoanAndLoaiNguoiNhanAndReferenceTypeAndReferenceIdAndEventTypeAndDaDoc(
        Integer maTaiKhoan, String loaiNguoiNhan, String referenceType, String referenceId, String eventType, Boolean daDoc);

    boolean existsByMaTaiKhoanAndLoaiNguoiNhanAndReferenceTypeAndReferenceIdAndEventType(
        Integer maTaiKhoan, String loaiNguoiNhan, String referenceType, String referenceId, String eventType);

    List<ThongBao> findByMaTaiKhoanAndLoaiNguoiNhanAndDaGuiPushFalseOrderByCreatedAtAsc(
        Integer maTaiKhoan, String loaiNguoiNhan);
}
