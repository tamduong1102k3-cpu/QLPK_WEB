package com.qlpk.backend.repository;

import com.qlpk.backend.entity.PhanCongTroLyBacSi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface PhanCongTroLyBacSiRepository extends JpaRepository<PhanCongTroLyBacSi, Integer> {

    List<PhanCongTroLyBacSi> findByIdPhanCongBacSiIn(Collection<Integer> ids);

    List<PhanCongTroLyBacSi> findByIdPhanCongBacSi(Integer idPhanCongBacSi);

    boolean existsByIdPhanCongBacSiAndIdPhanCongTroLy(
            Integer idPhanCongBacSi, Integer idPhanCongTroLy);

    Optional<PhanCongTroLyBacSi> findByIdAndIdPhanCongBacSiAndIdPhanCongTroLy(
            Integer id, Integer idPhanCongBacSi, Integer idPhanCongTroLy);

    void deleteByIdPhanCongBacSi(Integer idPhanCongBacSi);

    void deleteByIdPhanCongTroLy(Integer idPhanCongTroLy);

    void deleteByIdPhanCongBacSiIn(Collection<Integer> ids);

    void deleteByIdPhanCongTroLyIn(Collection<Integer> ids);
}
