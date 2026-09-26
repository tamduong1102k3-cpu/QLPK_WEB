package com.qlpk.backend.service.impl;

import com.qlpk.backend.entity.NhanVien;
import com.qlpk.backend.dto.NhanVienRequestDTO;
import com.qlpk.backend.repository.NhanVienRepository;
import com.qlpk.backend.service.NhanVienService;
import com.qlpk.backend.repository.TaiKhoanRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class NhanVienServiceImpl implements NhanVienService {

    @Autowired
    private NhanVienRepository nhanVienRepository;

    @Autowired
    private TaiKhoanRepository taiKhoanRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public List<NhanVien> getAllNhanVien() {
        return nhanVienRepository.findAll();
    }

    @Override
    public List<NhanVien> searchNhanVien(String keyword, Integer chuyenKhoa, String vaiTro) {
        return nhanVienRepository.searchNhanVien(keyword, chuyenKhoa, vaiTro);
    }

    @Override
    public NhanVien getNhanVienById(Integer id) {
        return nhanVienRepository.findById(id).orElse(null);
    }

    @Override
    public List<NhanVien> getNhanVienByChucVu(String chucVu) {
        return nhanVienRepository.findByChucVu(chucVu);
    }

    @Override
    public List<NhanVien> getNhanVienByChuyenKhoa(Integer chuyenKhoa) {
        return nhanVienRepository.findByChuyenKhoa(chuyenKhoa);
    }

    @Override
    public List<NhanVien> getBacSiByChuyenKhoa(Integer chuyenKhoa) {
        return nhanVienRepository.findByChucVuAndChuyenKhoa("Bác sĩ", chuyenKhoa);
    }

    @Override
    @Transactional
    public void addNhanVienViaProcedure(NhanVienRequestDTO dto) {

        String defaultPassword = passwordEncoder.encode("12345");

        nhanVienRepository.themNhanVienVaTaiKhoan(
            dto.getHoTen(),
            dto.getGioiTinh(),
            dto.getNgaySinh(),
            dto.getCccd(),
            dto.getDiaChi(),
            dto.getSoDienThoai(),
            dto.getEmail(),
            dto.getBangCap(),
            dto.getChucVu(),
            dto.getChuyenKhoa(),
            dto.getNgayVaoLam(),
            dto.getUsername(),
            defaultPassword,
            dto.getRole()
        );
    }

    @Override
    @Transactional
    public void updateNhanVien(Integer id, NhanVienRequestDTO dto) {
        NhanVien nv = nhanVienRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy nhân viên"));

        nv.setHoTen(dto.getHoTen());
        nv.setGioiTinh(dto.getGioiTinh());
        nv.setNgaySinh(dto.getNgaySinh());
        nv.setCccd(dto.getCccd());
        nv.setDiaChi(dto.getDiaChi());
        nv.setSoDienThoai(dto.getSoDienThoai());
        nv.setEmail(dto.getEmail());
        nv.setChuyenKhoa(dto.getChuyenKhoa());
        nv.setBangCap(dto.getBangCap());
        nv.setChucVu(dto.getChucVu());
        nv.setNgayVaoLam(dto.getNgayVaoLam());

        nhanVienRepository.save(nv);
    }

    @Override
    @Transactional
    public void deleteNhanVien(Integer id) {

        taiKhoanRepository.deleteByMaNhanVien(id);

        nhanVienRepository.deleteById(id);
    }
}
