package com.qlpk.backend.service.impl;

import com.qlpk.backend.dto.PrescriptionRequest;
import com.qlpk.backend.entity.ChiTietToaThuoc;
import com.qlpk.backend.entity.KhoThuoc;
import com.qlpk.backend.entity.Thuoc;
import com.qlpk.backend.entity.ToaThuoc;
import com.qlpk.backend.repository.ChiTietToaThuocRepository;
import com.qlpk.backend.repository.KhoThuocRepository;
import com.qlpk.backend.repository.ThuocRepository;
import com.qlpk.backend.repository.ToaThuocRepository;
import com.qlpk.backend.service.ToaThuocService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
public class ToaThuocServiceImpl implements ToaThuocService {

    @Autowired private ToaThuocRepository repository;
    @Autowired private ChiTietToaThuocRepository chiTietRepository;
    @Autowired private KhoThuocRepository khoThuocRepository;
    @Autowired private ThuocRepository thuocRepository;

    @Override public List<ToaThuoc> getAll() { return repository.findAll(); }

    @Override public ToaThuoc getById(Integer id) { return repository.findById(id).orElse(null); }

    @Override public ToaThuoc create(ToaThuoc entity) { return repository.save(entity); }

    @Override
    public ToaThuoc update(Integer id, ToaThuoc entity) {
        if (repository.existsById(id)) { return repository.save(entity); }
        return null;
    }

    @Override public void delete(Integer id) { repository.deleteById(id); }

    @Override
    @Transactional
    public ToaThuoc createPrescription(PrescriptionRequest request) throws Exception {
        ToaThuoc toa = request.getToaThuoc();
        List<ChiTietToaThuoc> details = request.getChiTietList();

        kiemTraVersionThuoc(request);

        xoaToaCuNeuCo(toa.getMaPhieuKham());

        if (details == null || details.isEmpty()) { return null; }

        thietLapThongTinToa(toa);

        ToaThuoc savedToa = repository.save(toa);

        themChiTietVaGiuThuoc(savedToa, details);
        return savedToa;
    }

    private void kiemTraVersionThuoc(PrescriptionRequest request) {
        List<ChiTietToaThuoc> details = request.getChiTietList();
        List<Long> versionList = request.getVersionThuocList();
        if (details == null || details.isEmpty()) { return; }
        for (int i = 0; i < details.size(); i++) {
            ChiTietToaThuoc item = details.get(i);
            if (item.getMaThuoc() == null) { continue; }
            Thuoc thuoc = thuocRepository.findById(item.getMaThuoc())
                    .orElseThrow(() -> new ObjectOptimisticLockingFailureException(
                            Thuoc.class, item.getMaThuoc()));
            Long clientVersion = (versionList != null && i < versionList.size()) ? versionList.get(i) : null;
            if (clientVersion == null || !clientVersion.equals(thuoc.getVersion())) {
                throw new ObjectOptimisticLockingFailureException(Thuoc.class, item.getMaThuoc());
            }
        }
    }

    private void xoaToaCuNeuCo(Integer maPhieuKham) throws Exception {
        if (maPhieuKham == null) { return; }
        List<ToaThuoc> existingToas = repository.findByMaPhieuKham(maPhieuKham);
        if (existingToas == null || existingToas.isEmpty()) { return; }
        for (ToaThuoc oldToa : existingToas) {

            if (!"CHO_THANH_TOAN".equals(oldToa.getTrangThai())) { continue; }
            List<ChiTietToaThuoc> oldDetails = chiTietRepository.findByMaToaThuoc(oldToa.getMaToaThuoc());
            if (oldDetails != null && !oldDetails.isEmpty()) {

                oldDetails.sort(Comparator.comparing(ChiTietToaThuoc::getMaThuoc, Comparator.nullsLast(Integer::compareTo)));
                hoanLaiThuocDaGiu(oldDetails);

                chiTietRepository.deleteAll(oldDetails);
            }

            repository.delete(oldToa);
        }
    }

    private void hoanLaiThuocDaGiu(List<ChiTietToaThuoc> oldDetails) throws Exception {
        for (ChiTietToaThuoc oldItem : oldDetails) {

            KhoThuoc kho = khoThuocRepository.findByMaThuocForUpdate(oldItem.getMaThuoc())
                    .orElseThrow(() -> new Exception("Không tìm thấy thuốc trong kho: " + oldItem.getMaThuoc()));

            int soLuongDaGiu = kho.getSoLuongDaGiu() != null ? kho.getSoLuongDaGiu() : 0;

            int soLuongDaGiuCuaToa = tinhSoLuongCan(oldItem);

            kho.setSoLuongDaGiu(Math.max(0, soLuongDaGiu - soLuongDaGiuCuaToa));

            kho.setNgayCapNhatCuoi(LocalDateTime.now());
        }
    }

    private void thietLapThongTinToa(ToaThuoc toa) {
        if (toa.getNgayTao() == null) { toa.setNgayTao(LocalDateTime.now()); }
        if (toa.getTrangThai() == null) { toa.setTrangThai("CHO_THANH_TOAN"); }
    }

    private void themChiTietVaGiuThuoc(ToaThuoc savedToa, List<ChiTietToaThuoc> details) throws Exception {
        details.sort(Comparator.comparing(ChiTietToaThuoc::getMaThuoc, Comparator.nullsLast(Integer::compareTo)));
        for (ChiTietToaThuoc item : details) {
            xuLyThuocTrongToa(savedToa, item);
        }
    }

    private int tinhSoLuongCan(ChiTietToaThuoc item) {
        int sang = parseLieu(item.getSang());
        int trua = parseLieu(item.getTrua());
        int chieu = parseLieu(item.getChieu());
        int toi = parseLieu(item.getToi());
        int soNgay = item.getSoNgay() != null ? item.getSoNgay() : 0;
        return (sang + trua + chieu + toi) * soNgay;
    }

    private int parseLieu(String value) {
        if (value == null || value.trim().isEmpty()) { return 0; }
        return Integer.parseInt(value.trim());
    }

    private void xuLyThuocTrongToa(ToaThuoc savedToa, ChiTietToaThuoc item) throws Exception {
        KhoThuoc kho = khoThuocRepository.findByMaThuocForUpdate(item.getMaThuoc())
                .orElseThrow(() -> new Exception("Không tìm thấy thuốc trong kho: " + item.getMaThuoc()));
        int soLuongCan = tinhSoLuongCan(item);
        int soLuongDaGiu = kho.getSoLuongDaGiu() != null ? kho.getSoLuongDaGiu() : 0;
        int soLuongTon = kho.getSoLuongTon() != null ? kho.getSoLuongTon() : 0;
        int soLuongKhaDung = soLuongTon - soLuongDaGiu;
        if (soLuongKhaDung < soLuongCan) {
            throw new Exception("Thuốc mã " + item.getMaThuoc() + " không đủ số lượng. Cần: " + soLuongCan + ", khả dụng: " + soLuongKhaDung);
        }
        kho.setSoLuongDaGiu(soLuongDaGiu + soLuongCan);

        kho.setNgayCapNhatCuoi(LocalDateTime.now());
        item.setMaToaThuoc(savedToa.getMaToaThuoc());
        chiTietRepository.save(item);
    }

    @Override public List<ToaThuoc> findByMaPhieuKham(Integer maPhieuKham) { return repository.findByMaPhieuKham(maPhieuKham); }

    @Override public List<ToaThuoc> findByMaBenhNhan(Integer maBenhNhan) { return repository.findByMaBenhNhan(maBenhNhan); }

    @Override
    @Transactional
    public void deleteByMaPhieuKham(Integer maPhieuKham) throws Exception {

        xoaToaCuNeuCo(maPhieuKham);
    }
}
