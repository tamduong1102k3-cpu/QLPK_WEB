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

    /** Tìm kiếm bệnh nhân theo tên, số điện thoại hoặc CCCD */
    @Query("""
        SELECT b FROM BenhNhan b
        WHERE LOWER(b.hoTen) LIKE LOWER(CONCAT('%', :keyword, '%'))
           OR b.soDienThoai LIKE CONCAT('%', :keyword, '%')
           OR b.cccd LIKE CONCAT('%', :keyword, '%')
        ORDER BY b.maBenhNhan DESC
    """)
    List<BenhNhan> search(@Param("keyword") String keyword);

    /**
     * Tìm chính xác theo họ tên 
     * số điện thoại và CCCD (dùng cho liên kết hồ sơ cũ).

     */
    @Query(value = """
        SELECT * FROM benh_nhan b
        WHERE TRIM(LOWER(b.ho_ten)) COLLATE utf8mb4_0900_ai_ci = LOWER(TRIM(?1))
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
        WHERE (?1 IS NULL OR TRIM(LOWER(b.ho_ten)) COLLATE utf8mb4_0900_ai_ci = LOWER(TRIM(?1)))
          AND (?2 IS NULL OR TRIM(b.so_dien_thoai) = TRIM(?2))
          AND (?3 IS NULL OR TRIM(b.cccd) = TRIM(?3))
    """, nativeQuery = true)
    List<BenhNhan> findFlexible(@Param("hoTen") String hoTen,
                                 @Param("soDienThoai") String soDienThoai,
                                 @Param("cccd") String cccd);

    boolean existsBySoDienThoai(String soDienThoai);
    boolean existsByCccd(String cccd);
    boolean existsByEmail(String email);

    /** Tăng số lần quá hẹn của bệnh nhân lên 1 (dùng trong scheduler tính so_lan_qua_hen). */
    @Modifying
    @Query("UPDATE BenhNhan b SET b.soLanQuaHen = b.soLanQuaHen + 1 WHERE b.maBenhNhan = :maBenhNhan")
    void tangSoLanQuaHen(@Param("maBenhNhan") Integer maBenhNhan);

    /**
     * Reset số lần quá hẹn của TẤT CẢ bệnh nhân về 0.
     * Dùng cho scheduler đầu mỗi tháng và cho admin reset tay.
     * Chỉ cập nhật các bản ghi đang có giá trị > 0 để tránh ghi thừa.
     */
    @Modifying
    @Query("UPDATE BenhNhan b SET b.soLanQuaHen = 0 WHERE b.soLanQuaHen > 0")
    int resetAllSoLanQuaHen();
}
