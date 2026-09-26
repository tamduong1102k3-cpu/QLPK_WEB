package com.qlpk.backend.repository;

import com.qlpk.backend.entity.KhoThuoc;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KhoThuocRepository extends JpaRepository<KhoThuoc, Integer> {

    List<KhoThuoc> findBySoLuongTonLessThan(Integer threshold);

    List<KhoThuoc> findBySoLuongTonLessThanOrderBySoLuongTonAsc(Integer threshold);

    Optional<KhoThuoc> findByMaThuoc(Integer maThuoc);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT k
        FROM KhoThuoc k
        WHERE k.maThuoc = :maThuoc
    """)
    Optional<KhoThuoc> findByMaThuocForUpdate(
            @Param("maThuoc") Integer maThuoc
    );
}
