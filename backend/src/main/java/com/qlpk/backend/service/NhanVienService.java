package com.qlpk.backend.service;

import com.qlpk.backend.entity.NhanVien;
import com.qlpk.backend.dto.NhanVienRequestDTO;
import java.util.List;

public interface NhanVienService {
    List<NhanVien> getAllNhanVien();
    List<NhanVien> searchNhanVien(String keyword, Integer chuyenKhoa, String vaiTro);
    NhanVien getNhanVienById(Integer id);
    List<NhanVien> getNhanVienByChucVu(String chucVu);
    List<NhanVien> getNhanVienByChuyenKhoa(Integer chuyenKhoa);
    List<NhanVien> getBacSiByChuyenKhoa(Integer chuyenKhoa);
    void addNhanVienViaProcedure(NhanVienRequestDTO dto);
    void updateNhanVien(Integer id, NhanVienRequestDTO dto);
    void deleteNhanVien(Integer id);
}
