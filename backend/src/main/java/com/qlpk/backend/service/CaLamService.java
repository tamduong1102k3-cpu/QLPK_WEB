package com.qlpk.backend.service;

import com.qlpk.backend.entity.CaLam;
import java.util.List;

public interface CaLamService {
    List<CaLam> getAll();
    CaLam getById(Integer id);
    CaLam create(CaLam entity);
    CaLam update(Integer id, CaLam entity);
    void delete(Integer id);
}
