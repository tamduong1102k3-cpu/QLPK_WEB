package com.qlpk.backend.service.impl;

import com.qlpk.backend.entity.BenhNhan;
import com.qlpk.backend.entity.TaiKhoanBenhNhan;
import com.qlpk.backend.repository.BenhNhanRepository;
import com.qlpk.backend.repository.TaiKhoanBenhNhanRepository;
import com.qlpk.backend.service.TaiKhoanBenhNhanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class TaiKhoanBenhNhanServiceImpl implements TaiKhoanBenhNhanService {

    @Autowired
    private TaiKhoanBenhNhanRepository taiKhoanBenhNhanRepository;

    @Autowired
    private BenhNhanRepository benhNhanRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public List<TaiKhoanBenhNhan> getAllTaiKhoanBenhNhan() {
        return taiKhoanBenhNhanRepository.findAll();
    }

    @Override
    public Optional<TaiKhoanBenhNhan> getTaiKhoanBenhNhanById(Integer id) {
        return taiKhoanBenhNhanRepository.findById(id);
    }

    @Override
    public TaiKhoanBenhNhan createTaiKhoanBenhNhan(TaiKhoanBenhNhan taiKhoanBenhNhan) {

        if (taiKhoanBenhNhan.getMatKhau() != null && !taiKhoanBenhNhan.getMatKhau().isBlank()
                && !isBcryptHash(taiKhoanBenhNhan.getMatKhau())) {
            taiKhoanBenhNhan.setMatKhau(passwordEncoder.encode(taiKhoanBenhNhan.getMatKhau()));
        }
        return taiKhoanBenhNhanRepository.save(taiKhoanBenhNhan);
    }

    @Override
    public TaiKhoanBenhNhan updateTaiKhoanBenhNhan(Integer id, TaiKhoanBenhNhan taiKhoanBenhNhanDetails) {
        Optional<TaiKhoanBenhNhan> existingOpt = taiKhoanBenhNhanRepository.findById(id);
        if (existingOpt.isPresent()) {
            TaiKhoanBenhNhan existing = existingOpt.get();
            if (taiKhoanBenhNhanDetails.getEmail() != null) {
                existing.setEmail(taiKhoanBenhNhanDetails.getEmail());
            }
            if (taiKhoanBenhNhanDetails.getSoDienThoai() != null) {
                existing.setSoDienThoai(taiKhoanBenhNhanDetails.getSoDienThoai());
            }

            if (taiKhoanBenhNhanDetails.getEmailVerified() != null) {
                existing.setEmailVerified(taiKhoanBenhNhanDetails.getEmailVerified());
            }
            if (taiKhoanBenhNhanDetails.getMaBenhNhan() != null) {
                existing.setMaBenhNhan(taiKhoanBenhNhanDetails.getMaBenhNhan());
            }
            if (taiKhoanBenhNhanDetails.getLanDangNhapCuoi() != null) {
                existing.setLanDangNhapCuoi(taiKhoanBenhNhanDetails.getLanDangNhapCuoi());
            }
            return taiKhoanBenhNhanRepository.save(existing);
        }
        return null;
    }

    @Override
    public void deleteTaiKhoanBenhNhan(Integer id) {

        Optional<TaiKhoanBenhNhan> accountOpt = taiKhoanBenhNhanRepository.findById(id);
        if (accountOpt.isPresent() && accountOpt.get().getMaBenhNhan() != null) {
            Integer maBenhNhan = accountOpt.get().getMaBenhNhan();
            benhNhanRepository.findById(maBenhNhan).ifPresent(benhNhan -> {
                boolean changed = false;
                if (benhNhan.getEmail() != null) {
                    benhNhan.setEmail(null);
                    changed = true;
                }
                if (benhNhan.getSoDienThoai() != null) {
                    benhNhan.setSoDienThoai(null);
                    changed = true;
                }
                if (changed) {
                    benhNhanRepository.save(benhNhan);
                }
            });
        }
        taiKhoanBenhNhanRepository.deleteById(id);
    }

    @Override
    public Optional<TaiKhoanBenhNhan> findByUsername(String username) {
        return taiKhoanBenhNhanRepository.findByUsername(username);
    }

    @Override
    public Optional<TaiKhoanBenhNhan> findByEmail(String email) {
        return taiKhoanBenhNhanRepository.findByEmail(email);
    }

    @Override
    public Optional<TaiKhoanBenhNhan> findBySoDienThoai(String soDienThoai) {
        return taiKhoanBenhNhanRepository.findBySoDienThoai(soDienThoai);
    }

    @Override
    public Optional<TaiKhoanBenhNhan> findByMaBenhNhan(Integer maBenhNhan) {
        return taiKhoanBenhNhanRepository.findByMaBenhNhan(maBenhNhan);
    }

    @Override
    public boolean existsByEmail(String email) {
        return taiKhoanBenhNhanRepository.existsByEmail(email);
    }

    @Override
    public boolean existsBySoDienThoai(String soDienThoai) {
        return taiKhoanBenhNhanRepository.existsBySoDienThoai(soDienThoai);
    }

    @Override
    public TaiKhoanBenhNhan login(String identity, String password) {
        Optional<TaiKhoanBenhNhan> accountOpt = taiKhoanBenhNhanRepository.findByEmail(identity);
        if (accountOpt.isEmpty()) {
            accountOpt = taiKhoanBenhNhanRepository.findByUsername(identity);
        }
        if (accountOpt.isEmpty()) {
            accountOpt = taiKhoanBenhNhanRepository.findBySoDienThoai(identity);
        }

        if (accountOpt.isEmpty() && identity != null && identity.matches("^\\d{9}$|^\\d{12}$")) {
            Optional<BenhNhan> benhNhanOpt = benhNhanRepository.findByCccd(identity);
            if (benhNhanOpt.isPresent()) {
                Integer maBenhNhan = benhNhanOpt.get().getMaBenhNhan();
                accountOpt = taiKhoanBenhNhanRepository.findByMaBenhNhan(maBenhNhan);
            }
        }

        if (accountOpt.isPresent()) {
            TaiKhoanBenhNhan account = accountOpt.get();
            if (passwordEncoder.matches(password, account.getMatKhau())) {

                account.setLanDangNhapCuoi(LocalDateTime.now());
                taiKhoanBenhNhanRepository.save(account);
                return account;
            }
        }
        return null;
    }

    @Override
    public boolean doiMatKhau(String email, String newPassword) {
        Optional<TaiKhoanBenhNhan> accountOpt = taiKhoanBenhNhanRepository.findByEmail(email);
        if (accountOpt.isPresent()) {
            TaiKhoanBenhNhan account = accountOpt.get();
            account.setMatKhau(passwordEncoder.encode(newPassword));
            taiKhoanBenhNhanRepository.save(account);
            return true;
        }
        return false;
    }

    @Override
    public boolean emailVerified(String email) {
        Optional<TaiKhoanBenhNhan> accountOpt = taiKhoanBenhNhanRepository.findByEmail(email.trim());
        if (accountOpt.isPresent()) {
            TaiKhoanBenhNhan account = accountOpt.get();
            account.setEmailVerified(true);
            taiKhoanBenhNhanRepository.save(account);
            return true;
        }
        return false;
    }

    @Override
    public Optional<Integer> findMaBenhNhanByIdentity(String identity) {

        Optional<TaiKhoanBenhNhan> accountOpt = taiKhoanBenhNhanRepository.findByEmail(identity);
        if (accountOpt.isEmpty()) {
            accountOpt = taiKhoanBenhNhanRepository.findByUsername(identity);
        }
        if (accountOpt.isEmpty()) {
            accountOpt = taiKhoanBenhNhanRepository.findBySoDienThoai(identity);
        }

        if (accountOpt.isPresent() && accountOpt.get().getMaBenhNhan() != null) {
            return Optional.of(accountOpt.get().getMaBenhNhan());
        }
        return Optional.empty();
    }

    @Override
    public TaiKhoanBenhNhan linkPatient(Integer id, Integer maBenhNhan) {
        Optional<TaiKhoanBenhNhan> existingOpt = taiKhoanBenhNhanRepository.findById(id);
        if (existingOpt.isPresent()) {
            TaiKhoanBenhNhan existing = existingOpt.get();
            existing.setMaBenhNhan(maBenhNhan);
            return taiKhoanBenhNhanRepository.save(existing);
        }
        return null;
    }

    private boolean isBcryptHash(String password) {
        return password != null && (password.startsWith("$2a$") ||
                password.startsWith("$2b$") ||
                password.startsWith("$2y$"));
    }
}
