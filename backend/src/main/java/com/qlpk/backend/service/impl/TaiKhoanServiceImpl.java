package com.qlpk.backend.service.impl;

import com.qlpk.backend.entity.TaiKhoan;
import com.qlpk.backend.repository.ChuyenKhoaRepository;
import com.qlpk.backend.repository.NhanVienRepository;
import com.qlpk.backend.repository.TaiKhoanRepository;
import com.qlpk.backend.service.TaiKhoanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TaiKhoanServiceImpl implements TaiKhoanService {

    @Autowired
    private TaiKhoanRepository taiKhoanRepository;

    @Autowired
    private NhanVienRepository nhanVienRepository;

    @Autowired
    private ChuyenKhoaRepository chuyenKhoaRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public List<TaiKhoan> getAllTaiKhoan() {
        return taiKhoanRepository.findAll();
    }

    @Override
    public TaiKhoan getTaiKhoanById(Integer id) {
        return taiKhoanRepository.findById(id).orElse(null);
    }

    @Override
    public TaiKhoan createTaiKhoan(TaiKhoan taiKhoan) {
        return taiKhoanRepository.save(taiKhoan);
    }

    @Override
    public TaiKhoan updateTaiKhoan(Integer id, TaiKhoan taiKhoanDetails) {
        TaiKhoan taiKhoan = taiKhoanRepository.findById(id).orElse(null);
        if (taiKhoan != null) {
            taiKhoan.setUsername(taiKhoanDetails.getUsername());
            taiKhoan.setEmail(taiKhoanDetails.getEmail());

            if (taiKhoanDetails.getMatKhau() != null && !taiKhoanDetails.getMatKhau().isBlank()) {
                taiKhoan.setMatKhau(taiKhoanDetails.getMatKhau());
            }
            if (taiKhoanDetails.getVaiTro() != null) {
                taiKhoan.setVaiTro(taiKhoanDetails.getVaiTro());
            }
            return taiKhoanRepository.save(taiKhoan);
        }
        return null;
    }

    @Override
    public void deleteTaiKhoan(Integer id) {
        taiKhoanRepository.deleteById(id);
    }

    @Override
    public TaiKhoan login(String identity, String password) {
        TaiKhoan account = taiKhoanRepository.findByEmail(identity);
        if (account == null) {
            account = taiKhoanRepository.findByUsername(identity);
        }

        if (account != null && passwordEncoder.matches(password, account.getMatKhau())) {
            return account;
        }
        return null;
    }

    @Override
    public TaiKhoan findByEmail(String email) {
        return taiKhoanRepository.findByEmail(email);
    }

    @Override
    public TaiKhoan findByUsername(String username) {
        return taiKhoanRepository.findByUsername(username);
    }

    @Override
    public boolean doiMatKhauTheoEmail(String email, String newPassword) {
        TaiKhoan account = taiKhoanRepository.findByEmail(email);
        if (account != null) {
            account.setMatKhau(passwordEncoder.encode(newPassword));
            taiKhoanRepository.save(account);
            return true;
        }
        return false;
    }

    @Override
    public boolean doiMatKhauLanDau(String email, String newPassword) {
        TaiKhoan account = taiKhoanRepository.findByEmail(email);
        if (account != null) {
            account.setMatKhau(passwordEncoder.encode(newPassword));
            account.setLanDauDangNhap(false); 
            taiKhoanRepository.save(account);
            return true;
        }
        return false;
    }

    @Override
    public boolean changePassword(Integer id, String oldPassword, String newPassword) {
        TaiKhoan account = taiKhoanRepository.findById(id).orElse(null);
        if (account == null) {
            return false;
        }

        if (!passwordEncoder.matches(oldPassword, account.getMatKhau())) {
            throw new RuntimeException("Mật khẩu hiện tại không chính xác!");
        }

        account.setMatKhau(passwordEncoder.encode(newPassword));
        taiKhoanRepository.save(account);
        return true;
    }

    @Override
    public Map<String, Object> getChuyenKhoaInfo(Integer maNhanVien) {
        Map<String, Object> result = new HashMap<>();
        result.put("maChuyenKhoa", "");
        result.put("tenChuyenKhoa", "");

        if (maNhanVien != null) {
            var nhanVienOpt = nhanVienRepository.findById(maNhanVien);
            if (nhanVienOpt.isPresent()) {
                Integer maCK = nhanVienOpt.get().getChuyenKhoa();
                if (maCK != null) {
                    result.put("maChuyenKhoa", maCK);

                    var ckOpt = chuyenKhoaRepository.findById(maCK);
                    if (ckOpt.isPresent()) {
                        result.put("tenChuyenKhoa", ckOpt.get().getTenChuyenKhoa());
                    }
                }
            }
        }
        return result;
    }
}
