package com.qlpk.backend.service.impl;

import com.qlpk.backend.dto.KhamLamSangAndVitalsDTO;
import com.qlpk.backend.entity.ChiSoKhamTongHop;
import com.qlpk.backend.entity.KhamLamSang;
import com.qlpk.backend.repository.ChiSoKhamTongHopRepository;
import com.qlpk.backend.repository.DangKyKhamBenhRepository;
import com.qlpk.backend.repository.KhamLamSangRepository;
import com.qlpk.backend.repository.PhieuKhamRepository;
import com.qlpk.backend.service.KhamLamSangService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class KhamLamSangServiceImpl implements KhamLamSangService {

    @Autowired
    private KhamLamSangRepository repository;

    @Autowired
    private PhieuKhamRepository phieuKhamRepository;

    @Autowired
    private DangKyKhamBenhRepository dangKyRepository;

    @Autowired
    private ChiSoKhamTongHopRepository chiSoKhamTongHopRepository;

    @Override
    public List<KhamLamSang> getAll() {
        return repository.findAll();
    }

    @Override
    public KhamLamSang getById(Integer id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public KhamLamSang create(KhamLamSang entity) {
        return repository.save(entity);
    }

    @Override
    public KhamLamSang update(Integer id, KhamLamSang entity) {
        if (repository.existsById(id)) {
            return repository.save(entity);
        }
        return null;
    }

    @Override
    public void delete(Integer id) {
        repository.deleteById(id);
    }

    @Override
    @Transactional
    public KhamLamSang saveAndUpdateStatus(KhamLamSang body) {
        KhamLamSang savedData;
        Optional<KhamLamSang> existing = repository.findByMaPhieuKham(body.getMaPhieuKham());
        if (existing.isPresent()) {
            KhamLamSang item = existing.get();
            item.setLyDoKham(body.getLyDoKham());
            item.setTienSuBanThan(body.getTienSuBanThan());
            item.setBenhSu(body.getBenhSu());
            item.setChanDoanSoBo(body.getChanDoanSoBo());
            item.setLoiDanBacSi(body.getLoiDanBacSi());
            item.setKetQuaKhamCanLamSang(body.getKetQuaKhamCanLamSang());
            item.setKhamLamSang(body.getKhamLamSang());
            savedData = repository.save(item);
        } else {
            savedData = repository.save(body);
        }

        phieuKhamRepository.findById(body.getMaPhieuKham()).ifPresent(pk -> {
            if (!"HOAN_THANH".equals(pk.getTrangThai())) {
                pk.setTrangThai("DA_KHAM_LAM_SANG");
            }
            if (body.getMaBacSi() != null) {
                pk.setMaNhanVien(body.getMaBacSi());
            }
            phieuKhamRepository.save(pk);
        });

        dangKyRepository.findByMaPhieuKham(body.getMaPhieuKham()).ifPresent(dk -> {
            if (!"HOAN_THANH".equals(dk.getTrangThai())) {
                dk.setTrangThai("DA_KHAM_LAM_SANG");
            }
            dangKyRepository.save(dk);
        });

        return savedData;
    }

    @Override
    public Optional<KhamLamSang> findByMaPhieuKham(Integer maPhieuKham) {
        return repository.findByMaPhieuKham(maPhieuKham);
    }

    @Override
    public List<KhamLamSang> findByMaBenhNhan(Integer maBenhNhan) {
        return repository.findByMaBenhNhan(maBenhNhan);
    }

    @Override
    @Transactional
    public KhamLamSangAndVitalsDTO saveKhamLamSangAndVitals(KhamLamSangAndVitalsDTO dto) {
        ChiSoKhamTongHop vitals = dto.getChiSoKhamTongHop();
        KhamLamSang exam = dto.getKhamLamSang();

        ChiSoKhamTongHop savedVitals = null;
        if (vitals != null && vitals.getMaPhieuKham() != null) {
            savedVitals = chiSoKhamTongHopRepository.findTopByMaPhieuKhamOrderByNgayTaoDesc(vitals.getMaPhieuKham())
                .map(existing -> {
                    if (vitals.getMaNhanVienNhap() != null) existing.setMaNhanVienNhap(vitals.getMaNhanVienNhap());
                    if (vitals.getNhietDo() != null) existing.setNhietDo(vitals.getNhietDo());
                    if (vitals.getNhipTim() != null) existing.setNhipTim(vitals.getNhipTim());
                    if (vitals.getNhipTho() != null) existing.setNhipTho(vitals.getNhipTho());
                    if (vitals.getHuyetApTamThu() != null) existing.setHuyetApTamThu(vitals.getHuyetApTamThu());
                    if (vitals.getHuyetApTamTruong() != null) existing.setHuyetApTamTruong(vitals.getHuyetApTamTruong());
                    if (vitals.getCanNang() != null) existing.setCanNang(vitals.getCanNang());
                    if (vitals.getChieuCao() != null) existing.setChieuCao(vitals.getChieuCao());
                    if (vitals.getSpo2() != null) existing.setSpo2(vitals.getSpo2());
                    if (vitals.getVongDau() != null) existing.setVongDau(vitals.getVongDau());
                    if (vitals.getTinhTrangDinhDuong() != null) existing.setTinhTrangDinhDuong(vitals.getTinhTrangDinhDuong());
                    if (vitals.getTamLyHanhVi() != null) existing.setTamLyHanhVi(vitals.getTamLyHanhVi());
                    
                    // Răng Hàm Mặt
                    if (vitals.getTinhTrangRang() != null) existing.setTinhTrangRang(vitals.getTinhTrangRang());
                    if (vitals.getSauRang() != null) existing.setSauRang(vitals.getSauRang());
                    if (vitals.getCaoRang() != null) existing.setCaoRang(vitals.getCaoRang());
                    if (vitals.getViemNuou() != null) existing.setViemNuou(vitals.getViemNuou());
                    if (vitals.getKhopCan() != null) existing.setKhopCan(vitals.getKhopCan());
                    if (vitals.getNiemMacMieng() != null) existing.setNiemMacMieng(vitals.getNiemMacMieng());
                    if (vitals.getDoLungLay() != null) existing.setDoLungLay(vitals.getDoLungLay());
                    if (vitals.getPhuHinhCu() != null) existing.setPhuHinhCu(vitals.getPhuHinhCu());
                    if (vitals.getBenhLyKhacRhm() != null) existing.setBenhLyKhacRhm(vitals.getBenhLyKhacRhm());

                    // Nhi khoa & Cận lâm sàng khác
                    if (vitals.getKhamTaiMuiHongNhi() != null) existing.setKhamTaiMuiHongNhi(vitals.getKhamTaiMuiHongNhi());
                    if (vitals.getKhamHoHapNhi() != null) existing.setKhamHoHapNhi(vitals.getKhamHoHapNhi());
                    if (vitals.getKhamDuNiemMacNhi() != null) existing.setKhamDuNiemMacNhi(vitals.getKhamDuNiemMacNhi());
                    if (vitals.getKhamDaNiemMacNhi() != null) existing.setKhamDaNiemMacNhi(vitals.getKhamDaNiemMacNhi());
                    if (vitals.getCoQuanKhacNhi() != null) existing.setCoQuanKhacNhi(vitals.getCoQuanKhacNhi());
                    if (vitals.getThinhLucTaiTrai() != null) existing.setThinhLucTaiTrai(vitals.getThinhLucTaiTrai());
                    if (vitals.getThinhLucTaiPhai() != null) existing.setThinhLucTaiPhai(vitals.getThinhLucTaiPhai());

                    // Tai Mũi Họng
                    if (vitals.getTinhTrangMui() != null) existing.setTinhTrangMui(vitals.getTinhTrangMui());
                    if (vitals.getTinhTrangHong() != null) existing.setTinhTrangHong(vitals.getTinhTrangHong());
                    if (vitals.getSoiTaiMuiHong() != null) existing.setSoiTaiMuiHong(vitals.getSoiTaiMuiHong());
                    if (vitals.getOngTai() != null) existing.setOngTai(vitals.getOngTai());
                    if (vitals.getMangNhiPhai() != null) existing.setMangNhiPhai(vitals.getMangNhiPhai());
                    if (vitals.getMangNhiTrai() != null) existing.setMangNhiTrai(vitals.getMangNhiTrai());
                    if (vitals.getVachNgan() != null) existing.setVachNgan(vitals.getVachNgan());
                    if (vitals.getCuonMui() != null) existing.setCuonMui(vitals.getCuonMui());
                    if (vitals.getKheMui() != null) existing.setKheMui(vitals.getKheMui());
                    if (vitals.getAmidan() != null) existing.setAmidan(vitals.getAmidan());
                    if (vitals.getThanhQuan() != null) existing.setThanhQuan(vitals.getThanhQuan());

                    // Lipids & Đường huyết & ECG & Siêu âm & Ghi chú
                    if (vitals.getCholesterol() != null) existing.setCholesterol(vitals.getCholesterol());
                    if (vitals.getHdlCholesterol() != null) existing.setHdlCholesterol(vitals.getHdlCholesterol());
                    if (vitals.getLdlCholesterol() != null) existing.setLdlCholesterol(vitals.getLdlCholesterol());
                    if (vitals.getTriglyceride() != null) existing.setTriglyceride(vitals.getTriglyceride());
                    if (vitals.getDuongHuyet() != null) existing.setDuongHuyet(vitals.getDuongHuyet());
                    if (vitals.getEcgKetQua() != null) existing.setEcgKetQua(vitals.getEcgKetQua());
                    if (vitals.getSieuAmTim() != null) existing.setSieuAmTim(vitals.getSieuAmTim());
                    if (vitals.getGhiChu() != null) existing.setGhiChu(vitals.getGhiChu());
                    
                    return chiSoKhamTongHopRepository.save(existing);
                })
                .orElseGet(() -> chiSoKhamTongHopRepository.save(vitals));
        }

        KhamLamSang savedExam = null;
        if (exam != null) {
            savedExam = saveAndUpdateStatus(exam);
        }

        KhamLamSangAndVitalsDTO result = new KhamLamSangAndVitalsDTO();
        result.setChiSoKhamTongHop(savedVitals);
        result.setKhamLamSang(savedExam);
        return result;
    }
}