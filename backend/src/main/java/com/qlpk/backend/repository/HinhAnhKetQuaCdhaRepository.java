package com.qlpk.backend.repository;

import com.qlpk.backend.entity.HinhAnhKetQuaCdha;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HinhAnhKetQuaCdhaRepository extends JpaRepository<HinhAnhKetQuaCdha, Integer> {
    List<HinhAnhKetQuaCdha> findByMaKetQuaCdhaOrderByThuTuAsc(Integer maKetQuaCdha);
    void deleteByMaKetQuaCdha(Integer maKetQuaCdha);
}
