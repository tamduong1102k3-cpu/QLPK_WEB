package com.qlpk.backend.repository;

import com.qlpk.backend.entity.BenhNhan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BenhNhanRepository extends JpaRepository<BenhNhan, Integer> {

    @Query("""
        SELECT b FROM BenhNhan b
        WHERE LOWER(b.hoTen) LIKE LOWER(CONCAT('%', :keyword, '%'))
           OR b.soDienThoai LIKE CONCAT('%', :keyword, '%')
           OR b.cccd LIKE CONCAT('%', :keyword, '%')
        ORDER BY b.maBenhNhan DESC
    """)
    List<BenhNhan> search(@Param("keyword") String keyword);

    @Query(value = """
        SELECT * FROM benh_nhan b
        WHERE TRIM(LOWER(b.ho_ten)) = LOWER(TRIM(?1)) COLLATE utf8mb4_0900_ai_ci
          AND TRIM(b.so_dien_thoai) = TRIM(?2)
          AND TRIM(b.cccd) = TRIM(?3)
        LIMIT 1
    """, nativeQuery = true)
    Optional<BenhNhan> findExactMatch(@Param("hoTen") String hoTen,
                                       @Param("soDienThoai") String soDienThoai,
                                       @Param("cccd") String cccd);

    @Query("SELECT b FROM BenhNhan b WHERE TRIM(b.cccd) = TRIM(:cccd)")
    Optional<BenhNhan> findByCccd(@Param("cccd") String cccd);

    Optional<BenhNhan> findFirstByCccd(String cccd);

    @Query(value = """
        SELECT * FROM benh_nhan b
        WHERE (?1 IS NULL OR TRIM(LOWER(b.ho_ten)) = LOWER(TRIM(?1)) COLLATE utf8mb4_0900_ai_ci)
          AND (?2 IS NULL OR TRIM(b.so_dien_thoai) = TRIM(?2))
          AND (?3 IS NULL OR TRIM(b.cccd) = TRIM(?3))
    """, nativeQuery = true)
    List<BenhNhan> findFlexible(@Param("hoTen") String hoTen,
                                 @Param("soDienThoai") String soDienThoai,
                                 @Param("cccd") String cccd);

    boolean existsBySoDienThoai(String soDienThoai);
    boolean existsByCccd(String cccd);
    boolean existsByEmail(String email);

    @Modifying
    @Query("UPDATE BenhNhan b SET b.soLanQuaHen = b.soLanQuaHen + 1 WHERE b.maBenhNhan = :maBenhNhan")
    void tangSoLanQuaHen(@Param("maBenhNhan") Integer maBenhNhan);
}
