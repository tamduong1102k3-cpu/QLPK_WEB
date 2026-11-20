package com.qlpk.backend.repository;

import com.qlpk.backend.dto.ChuyenKhoaLichSuDTO;
import com.qlpk.backend.dto.PhieuKhamLichSuDTO;
import com.qlpk.backend.entity.PhieuKham;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LichSuKhamRepository extends JpaRepository<PhieuKham, Integer> {

    @Query("""
            SELECT new com.qlpk.backend.dto.ChuyenKhoaLichSuDTO(ck.maChuyenKhoa, ck.tenChuyenKhoa)
            FROM PhieuKham pk JOIN ChuyenKhoa ck ON ck.maChuyenKhoa = pk.maChuyenKhoa
            WHERE pk.maBenhNhan = :maBenhNhan
              AND pk.trangThai = 'HOAN_THANH'
            GROUP BY ck.maChuyenKhoa, ck.tenChuyenKhoa
            ORDER BY ck.tenChuyenKhoa
            """)
    List<ChuyenKhoaLichSuDTO> findDistinctChuyenKhoa(@Param("maBenhNhan") Integer maBenhNhan);

    @Query("""
            SELECT new com.qlpk.backend.dto.PhieuKhamLichSuDTO(pk.maPhieuKham, pk.ngayKham, pk.trangThai)
            FROM PhieuKham pk
            WHERE pk.maBenhNhan = :maBenhNhan
              AND pk.maChuyenKhoa = :maChuyenKhoa
              AND pk.trangThai = 'HOAN_THANH'
            ORDER BY pk.ngayKham DESC
            """)
    List<PhieuKhamLichSuDTO> findPhieuKham(
            @Param("maBenhNhan") Integer maBenhNhan,
            @Param("maChuyenKhoa") Integer maChuyenKhoa);
}
