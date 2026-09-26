package com.qlpk.backend.repository;

import com.qlpk.backend.entity.LichKham;
import com.qlpk.backend.entity.NguonTao;
import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface LichKhamRepository extends JpaRepository<LichKham, Integer> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000"))
    @Query("SELECT l FROM LichKham l WHERE l.id = :id")
    Optional<LichKham> findByIdForUpdate(@Param("id") Integer id);

    List<LichKham> findByMaBenhNhan(Integer maBenhNhan);

    List<LichKham> findByNguonTao(NguonTao nguonTao);

    Optional<LichKham> findByMaDangKyKhamBenh(Integer maDangKyKhamBenh);

    List<LichKham> findByMaBacSi(Integer maBacSi);

    List<LichKham> findByNgayKham(LocalDate ngayKham);

    @Query("SELECT l FROM LichKham l WHERE l.ngayKham = :ngayKham " +
           "AND l.trangThai NOT IN ('HUY', 'HOAN', 'QUA_HEN') " +
           "ORDER BY l.ngayKham ASC")
    List<LichKham> findAppointmentsForReminder(@Param("ngayKham") LocalDate ngayKham);

    List<LichKham> findByMaChuyenKhoa(Integer maChuyenKhoa);

    List<LichKham> findByTrangThai(String trangThai);

    @Query("SELECT l FROM LichKham l WHERE l.ngayKham = :ngayKham AND l.trangThai NOT IN ('HUY', 'QUA_HEN', 'HOAN') ORDER BY l.ngayKham ASC")
    List<LichKham> findAppointmentsByDate(@Param("ngayKham") LocalDate ngayKham);

    @Query("SELECT l FROM LichKham l WHERE l.maBacSi = :maBacSi AND l.ngayKham = :ngayKham AND l.trangThai NOT IN ('HUY', 'QUA_HEN', 'HOAN') ORDER BY l.ngayKham ASC")
    List<LichKham> findAppointmentsByDoctorAndDate(@Param("maBacSi") Integer maBacSi, @Param("ngayKham") LocalDate ngayKham);

    @Query("SELECT l FROM LichKham l WHERE l.ngayKham >= :startDate AND l.ngayKham <= :endDate ORDER BY l.ngayKham ASC")
    List<LichKham> findAppointmentsBetweenDates(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    long countByNgayKhamAndTrangThai(LocalDate ngayKham, String trangThai);

    @Query("SELECT COUNT(l) FROM LichKham l WHERE l.maBenhNhan = :maBenhNhan " +
           "AND l.trangThai = 'CHUA_DEN' AND l.nguonTao = 'DAT_LICH_APP'")
    long countActiveByMaBenhNhan(@Param("maBenhNhan") Integer maBenhNhan);

    @Query("SELECT COUNT(l) FROM LichKham l WHERE l.maBenhNhan = :maBenhNhan " +
           "AND l.ngayKham = :ngayKham AND l.maCa = :maCa " +
           "AND l.nguonTao = 'DAT_LICH_APP' " +
           "AND l.trangThai NOT IN ('HUY', 'QUA_HEN', 'HOAN')")
    long countTuDatCungCa(
        @Param("maBenhNhan") Integer maBenhNhan,
        @Param("ngayKham") LocalDate ngayKham,
        @Param("maCa") Integer maCa
    );

    @Query("SELECT COUNT(l) FROM LichKham l WHERE l.maBenhNhan = :maBenhNhan " +
           "AND l.ngayKham = :ngayKham AND l.maCa = :maCa " +
           "AND l.nguonTao = 'TAI_KHAM' " +
           "AND l.trangThai NOT IN ('HUY', 'QUA_HEN', 'HOAN')")
    long countTaiKhamCungCa(
        @Param("maBenhNhan") Integer maBenhNhan,
        @Param("ngayKham") LocalDate ngayKham,
        @Param("maCa") Integer maCa
    );

    @Query("SELECT COUNT(l) FROM LichKham l WHERE l.maBenhNhan = :maBenhNhan AND l.ngayKham = :ngayKham " +
           "AND l.maCa = :maCa AND l.trangThai NOT IN ('HUY', 'QUA_HEN', 'HOAN')")
    long countByMaBenhNhanAndNgayKhamAndMaCa(
        @Param("maBenhNhan") Integer maBenhNhan, 
        @Param("ngayKham") LocalDate ngayKham,
        @Param("maCa") Integer maCa
    );

    @Query("SELECT COUNT(l) FROM LichKham l WHERE l.maBenhNhan = :maBenhNhan AND l.trangThai = 'HUY' AND l.ngayCapNhat >= :since")
    long countCancellationsSince(@Param("maBenhNhan") Integer maBenhNhan, @Param("since") java.time.LocalDateTime since);

    @Query("SELECT l FROM LichKham l WHERE " +
           "(:trangThai IS NULL OR l.trangThai = :trangThai) AND " +
           "(:maChuyenKhoa IS NULL OR l.maChuyenKhoa = :maChuyenKhoa) AND " +
           "(:maDichVu IS NULL OR l.maDichVu = :maDichVu) AND " +
           "(:ngayKham IS NULL OR l.ngayKham = :ngayKham) " +
           "ORDER BY l.ngayKham ASC")
    List<LichKham> searchAppointments(
        @Param("trangThai") String trangThai,
        @Param("maChuyenKhoa") Integer maChuyenKhoa,
        @Param("maDichVu") Integer maDichVu,
        @Param("ngayKham") LocalDate ngayKham
    );

    @Query("SELECT l FROM LichKham l WHERE " +
           "(:trangThai IS NULL OR l.trangThai = :trangThai) AND " +
           "(:nguonTao IS NULL OR l.nguonTao = :nguonTao) " +
           "ORDER BY l.ngayKham DESC")
    List<LichKham> searchAppointmentsByKeyword(
        @Param("trangThai") String trangThai,
        @Param("nguonTao") NguonTao nguonTao
    );

    @Query(value = "SELECT lk.* FROM lich_kham lk " +
           "WHERE lk.ngay_kham < :today AND lk.trang_thai = 'CHUA_DEN' " +
           "ORDER BY lk.ngay_kham ASC",
           nativeQuery = true)
    List<LichKham> findAppointmentsQuaNgayChuaDen(@Param("today") LocalDate today);

    @Query(value = "SELECT lk.* FROM lich_kham lk " +
           "WHERE lk.trang_thai = 'QUA_HEN' " +
           "  AND lk.nguon_tao = 'DAT_LICH_APP' " +
           "  AND lk.da_tinh_qua_hen = false",
           nativeQuery = true)
    List<LichKham> findQuaHenChuaTinhSoLan();

    @Modifying
    @Query("UPDATE LichKham l SET l.daTinhQuaHen = true " +
           "WHERE l.id = :maLichKham AND l.daTinhQuaHen = false AND l.trangThai = 'QUA_HEN'")
    int markDaTinhQuaHenIfEligible(@Param("maLichKham") Integer maLichKham);

    @Modifying
    @Query(value = """
        UPDATE lich_kham
        SET trang_thai = 'DA_CHECK_IN', ma_dang_ky_kham_benh = :maDangKy
        WHERE id = :id AND trang_thai IN ('CHUA_DEN', 'QUA_HEN')
        """, nativeQuery = true)
    int checkInIfEligible(@Param("id") Integer id, @Param("maDangKy") Integer maDangKy);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE LichKham l SET l.trangThai = 'QUA_HEN', l.ngayCapNhat = CURRENT_TIMESTAMP " +
           "WHERE l.id = :id AND l.trangThai = 'CHUA_DEN'")
    int capNhatQuaHenCoDieuKien(@Param("id") Integer id);

    List<LichKham> findByMaBacSiAndNgayKhamAndTrangThai(Integer maBacSi, LocalDate ngayKham, String trangThai);

    List<LichKham> findByMaLichKhamGoc(Integer maLichKhamGoc);
}
