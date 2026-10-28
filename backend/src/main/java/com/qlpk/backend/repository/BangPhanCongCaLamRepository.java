package com.qlpk.backend.repository;

import com.qlpk.backend.entity.BangPhanCongCaLam;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BangPhanCongCaLamRepository extends JpaRepository<BangPhanCongCaLam, Integer> {
    List<BangPhanCongCaLam> findByThu(String thu);
    List<BangPhanCongCaLam> findByNgay(LocalDate ngay);
    List<BangPhanCongCaLam> findByNgayIsNullAndThu(String thu);
    List<BangPhanCongCaLam> findByMaNhanVien(Integer maNhanVien);
    boolean existsByMaNhanVienAndNgayAndCa_Id(Integer maNhanVien, LocalDate ngay, Integer maCaId);
    Optional<BangPhanCongCaLam> findByMaNhanVienAndNgayAndCa_Id(Integer maNhanVien, LocalDate ngay, Integer maCaId);
    List<BangPhanCongCaLam> findByMaNhanVienAndNgayBetween(Integer maNhanVien, LocalDate start, LocalDate end);

    @Query("SELECT l.maNhanVien, l.thu FROM BangPhanCongCaLam l " +
            "WHERE l.maNhanVien IN :maNhanViens " +
            "AND l.kieuPhanCong = 'MAC_DINH' " +
            "AND (l.hanhDong IS NULL OR l.hanhDong <> 'NGHI_PHEP') " +
            "AND l.thu IN :dsThu " +
            "GROUP BY l.maNhanVien, l.thu")
    List<Object[]> findThuSummary(
            @Param("maNhanViens") List<Integer> maNhanViens,
            @Param("dsThu") List<String> dsThu);

    /**
     * Lấy ca làm việc của nhân viên theo (ngày cụ thể + ca).
     * OrderByIdDesc để lấy bản ghi mới nhất nếu có duplicate.
     */
    BangPhanCongCaLam findFirstByMaNhanVienAndNgayAndCaIdOrderByIdDesc(
            Integer maNhanVien, LocalDate ngay, Integer caId);

    /**
     * Lấy ca làm việc mặc định của nhân viên theo (ngày IS NULL + thứ + ca).
     * OrderByIdDesc để lấy bản ghi mới nhất nếu có duplicate.
     */
    BangPhanCongCaLam findFirstByMaNhanVienAndNgayIsNullAndThuAndCaIdOrderByIdDesc(
            Integer maNhanVien, String thu, Integer caId);

    @Modifying
    @Query(value = "INSERT IGNORE INTO bang_phan_cong_ca_lam " +
            "(ma_nhan_vien, ma_ca, phong, kieu_phan_cong, thu, ngay) " +
            "VALUES (:maNhanVien, :maCa, :phong, 'MAC_DINH', :thu, :ngay)",
            nativeQuery = true)
    int insertIgnore(@Param("maNhanVien") Integer maNhanVien,
                     @Param("maCa") Integer maCa,
                     @Param("phong") Integer phong,
                     @Param("thu") String thu,
                     @Param("ngay") LocalDate ngay);
}
