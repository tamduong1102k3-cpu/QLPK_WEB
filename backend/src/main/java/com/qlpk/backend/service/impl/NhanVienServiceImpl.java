package com.qlpk.backend.service.impl;

import com.qlpk.backend.entity.NhanVien;
import com.qlpk.backend.entity.TaiKhoan;
import com.qlpk.backend.dto.NhanVienRequestDTO;
import com.qlpk.backend.repository.NhanVienRepository;
import com.qlpk.backend.service.NhanVienService;
import com.qlpk.backend.repository.TaiKhoanRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${app.default-employee-password:12345}")
    private String defaultEmployeePassword;

    @Override
    public List<NhanVien> getAllNhanVien() {
        return populateHoatDong(nhanVienRepository.findAll());
    }

    private List<NhanVien> populateHoatDong(List<NhanVien> list) {
        for (NhanVien nv : list) {
            TaiKhoan taiKhoan = taiKhoanRepository.findByMaNhanVien(nv.getMaNhanVien());
            nv.setHoatDong(taiKhoan != null ? taiKhoan.getHoatDong() : false);
        }
        return list;
    }

    @Override
    public List<NhanVien> searchNhanVien(String keyword, Integer chuyenKhoa, String vaiTro) {
        return populateHoatDong(nhanVienRepository.searchNhanVien(keyword, chuyenKhoa, vaiTro));
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
        // Mã hóa mật khẩu mặc định bằng BCrypt
        String defaultPassword = passwordEncoder.encode(defaultEmployeePassword);

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
        TaiKhoan taiKhoan = taiKhoanRepository.findByMaNhanVien(id);
        if (taiKhoan == null) {
            throw new RuntimeException("Không tìm thấy tài khoản của nhân viên này.");
        }

        taiKhoan.setHoatDong(false);
        taiKhoanRepository.save(taiKhoan);
    }

    @Override
    @Transactional
    public void activateNhanVienAccount(Integer id) {
        TaiKhoan taiKhoan = taiKhoanRepository.findByMaNhanVien(id);
        if (taiKhoan == null) {
            throw new RuntimeException("Không tìm thấy tài khoản của nhân viên này.");
        }

        taiKhoan.setHoatDong(true);
        taiKhoanRepository.save(taiKhoan);
    }
}
