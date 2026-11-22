package com.qlpk.backend.service;

import com.qlpk.backend.entity.VaiTro;
import java.util.List;

public interface VaiTroService {
    List<VaiTro> getAll();
    VaiTro getById(String id);
    VaiTro create(VaiTro entity);
    VaiTro update(String id, VaiTro entity);
    void delete(String id);
}