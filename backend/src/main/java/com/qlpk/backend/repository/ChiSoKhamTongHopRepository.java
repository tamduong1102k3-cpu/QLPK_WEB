package com.qlpk.backend.repository;

import com.qlpk.backend.entity.ChiSoKhamTongHop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChiSoKhamTongHopRepository extends JpaRepository<ChiSoKhamTongHop, Integer> {

    java.util.Optional<ChiSoKhamTongHop> findTopByMaPhieuKhamOrderByNgayTaoDesc(Integer maPhieuKham);

    java.util.Optional<ChiSoKhamTongHop> findTopByMaPhieuKhamAndMaChuyenKhoaOrderByNgayTaoDesc(Integer maPhieuKham, Integer maChuyenKhoa);

    List<ChiSoKhamTongHop> findAllByMaPhieuKhamOrderByNgayTaoDesc(Integer maPhieuKham);
}
