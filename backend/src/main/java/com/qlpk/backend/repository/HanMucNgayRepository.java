package com.qlpk.backend.repository;

import com.qlpk.backend.entity.HanMucNgay;
import com.qlpk.backend.entity.HanMucNgayId;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface HanMucNgayRepository extends JpaRepository<HanMucNgay, HanMucNgayId> {

    @Modifying
    @Query(value = """
        INSERT INTO han_muc_ngay (ma_phong, ngay, so_da_dat, ngay_cap_nhat)
        VALUES (:maPhong, :ngay, 0, NOW())
        ON DUPLICATE KEY UPDATE ma_phong = ma_phong
        """, nativeQuery = true)
    void insertIfAbsent(@Param("maPhong") Integer maPhong,
                        @Param("ngay") LocalDate ngay);

    @Modifying
    @Query(value = """
        UPDATE han_muc_ngay hmn
        JOIN phong_chuc_nang pcn ON pcn.ma_phong = hmn.ma_phong
        SET hmn.so_da_dat = hmn.so_da_dat + 1,
            hmn.ngay_cap_nhat = NOW()
        WHERE hmn.ma_phong = :maPhong
          AND hmn.ngay = :ngay
          AND hmn.so_da_dat < pcn.so_luong_toi_da
        """, nativeQuery = true)
    int incrementIfAvailable(@Param("maPhong") Integer maPhong,
                             @Param("ngay") LocalDate ngay);

    @Modifying
    @Query(value = """
        UPDATE han_muc_ngay
        SET so_da_dat = GREATEST(so_da_dat - 1, 0),
            ngay_cap_nhat = NOW()
        WHERE ma_phong = :maPhong AND ngay = :ngay
        """, nativeQuery = true)
    int releaseSlot(@Param("maPhong") Integer maPhong,
                    @Param("ngay") LocalDate ngay);

    @Query("SELECT h FROM HanMucNgay h WHERE h.ngay = :ngay ORDER BY h.maPhong ASC")
    List<HanMucNgay> findByNgay(@Param("ngay") LocalDate ngay);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT h FROM HanMucNgay h WHERE h.maPhong = :maPhong AND h.ngay = :ngay")
    Optional<HanMucNgay> findForUpdate(@Param("maPhong") Integer maPhong,
                                        @Param("ngay") LocalDate ngay);
}
