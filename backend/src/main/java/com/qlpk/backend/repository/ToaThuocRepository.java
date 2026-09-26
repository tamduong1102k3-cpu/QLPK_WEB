package com.qlpk.backend.repository;

import com.qlpk.backend.entity.ToaThuoc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ToaThuocRepository extends JpaRepository<ToaThuoc, Integer> {
    List<ToaThuoc> findByMaPhieuKham(Integer maPhieuKham);

    @Query("SELECT t FROM ToaThuoc t WHERE t.maPhieuKham IN (SELECT p.maPhieuKham FROM PhieuKham p WHERE p.maBenhNhan = :maBenhNhan) ORDER BY t.ngayTao DESC")
    List<ToaThuoc> findByMaBenhNhan(@Param("maBenhNhan") Integer maBenhNhan);

    @Query("SELECT t FROM ToaThuoc t WHERE t.maPhieuKham = :maPhieuKham AND (t.trangThai IS NULL OR t.trangThai NOT IN ('DA_HUY')) ORDER BY t.ngayTao DESC")
    List<ToaThuoc> findActiveByMaPhieuKham(@Param("maPhieuKham") Integer maPhieuKham);

    @Modifying
    @Query("UPDATE ToaThuoc t SET t.trangThai = 'DA_CAP_THUOC' WHERE t.maToaThuoc = :maToaThuoc")
    int updateTrangThaiDaCapThuoc(@Param("maToaThuoc") Integer maToaThuoc);

    @Modifying
    @Query("UPDATE ToaThuoc t SET t.trangThai = 'CHO_CAP_THUOC', t.thoiGianHetHanNhanThuoc = :thoiGianHetHan WHERE t.maPhieuKham = :maPhieuKham AND (t.trangThai IS NULL OR t.trangThai NOT IN ('DA_HUY'))")
    int updateTrangThaiChoCapThuocByPhieuKham(@Param("maPhieuKham") Integer maPhieuKham, @Param("thoiGianHetHan") LocalDateTime thoiGianHetHan);

    @Query("SELECT t FROM ToaThuoc t WHERE t.trangThai = 'CHO_CAP_THUOC' AND t.thoiGianHetHanNhanThuoc IS NOT NULL AND t.thoiGianHetHanNhanThuoc < :now")
    List<ToaThuoc> findToaChoCapQuaHan(@Param("now") LocalDateTime now);

    @Modifying
    @Query("UPDATE ToaThuoc t SET t.trangThai = 'HET_HAN_NHAN_THUOC' WHERE t.maToaThuoc = :maToaThuoc")
    int updateTrangThaiHetHan(@Param("maToaThuoc") Integer maToaThuoc);
}
