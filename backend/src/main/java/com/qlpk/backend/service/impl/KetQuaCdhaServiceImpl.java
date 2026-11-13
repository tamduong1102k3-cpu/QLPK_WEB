package com.qlpk.backend.service.impl;

import com.qlpk.backend.entity.HinhAnhKetQuaCdha;
import com.qlpk.backend.entity.ChiTietChiDinh;
import com.qlpk.backend.entity.KetQuaCdha;
import com.qlpk.backend.entity.NhanVien;
import com.qlpk.backend.repository.ChiTietChiDinhRepository;
import com.qlpk.backend.repository.HinhAnhKetQuaCdhaRepository;
import com.qlpk.backend.repository.KetQuaCdhaRepository;
import com.qlpk.backend.service.ClsResultAuthorizationService;
import com.qlpk.backend.service.KetQuaCdhaService;
import com.qlpk.backend.util.TimeUtil;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class KetQuaCdhaServiceImpl implements KetQuaCdhaService {

    @Autowired
    private KetQuaCdhaRepository repository;

    @Autowired
    private HinhAnhKetQuaCdhaRepository hinhAnhKetQuaCdhaRepository;

    @Autowired
    private ChiTietChiDinhRepository chiTietRepository;

    @Autowired
    private ClsResultAuthorizationService clsResultAuthorizationService;

    @Override
    public List<KetQuaCdha> getAll() {
        List<KetQuaCdha> list = repository.findAll();
        NhanVien doctor = clsResultAuthorizationService.getClsDoctorIfAuthenticated();
        if (doctor != null) {
            list = list.stream()
                    .filter(result -> {
                        if (!"CHO_DUYET".equals(result.getTrangThai())) return true;
                        if (!doctor.getMaNhanVien().equals(result.getMaBacSiThucHien())) return false;
                        clsResultAuthorizationService.requireAuthorizedClsDetail(
                                result.getIdChiTietChiDinh(), doctor, "CLS_CHAN_DOAN_HINH_ANH");
                        return true;
                    })
                    .toList();
        }
        list.forEach(this::fillAnh);
        return list;
    }

    @Override
    public KetQuaCdha getById(Integer id) {
        KetQuaCdha kq = repository.findById(id).orElse(null);
        if (kq != null) {
            NhanVien doctor = clsResultAuthorizationService.getClsDoctorIfAuthenticated();
            if (doctor != null && "CHO_DUYET".equals(kq.getTrangThai())) {
                clsResultAuthorizationService.requireAuthorizedClsDetail(
                        kq.getIdChiTietChiDinh(), doctor, "CLS_CHAN_DOAN_HINH_ANH");
                clsResultAuthorizationService.requireDoctorOwnsPendingResult(
                        doctor.getMaNhanVien(), kq.getTrangThai(), kq.getMaBacSiThucHien());
            }
            fillAnh(kq);
        }
        return kq;
    }

    @Override
    @Transactional
    public KetQuaCdha create(KetQuaCdha entity) {
        NhanVien technician = clsResultAuthorizationService.requireTechnician();
        if (entity == null || entity.getIdChiTietChiDinh() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu chi tiết dịch vụ CĐHA");
        }
        ChiTietChiDinh detail = clsResultAuthorizationService.requireTechnicianClsDetail(
                entity.getIdChiTietChiDinh(), null, "CLS_CHAN_DOAN_HINH_ANH");
        if ("DA_DUYET".equals(entity.getTrangThai())
                || repository.existsByIdChiTietChiDinh(detail.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Kết quả CĐHA đã tồn tại hoặc không thể tạo");
        }
        entity.setId(null);
        entity.setMaBacSiThucHien(null);
        entity.setMaNhanVienThucHien(technician.getMaNhanVien());
        entity.setNgayThucHien(java.time.LocalDateTime.now());
        entity.setTrangThai("CHO_DUYET");
        KetQuaCdha saved = repository.save(entity);
        detail.setTrangThaiDv("DA_THUC_HIEN");
        detail.setMaNhanVienThucHien(technician.getMaNhanVien());
        chiTietRepository.save(detail);
        // Đồng bộ ảnh từ transient (FE mới gửi danhSachAnh, FE cũ gửi duongDanAnh1/2)
        syncAnh(saved.getId(), entity.getDanhSachAnh(), entity.getDuongDanAnh1(), entity.getDuongDanAnh2(), true);
        fillAnh(saved);
        return saved;
    }

    @Override
    @Transactional
    public KetQuaCdha update(Integer id, KetQuaCdha entity) {
        NhanVien technician = clsResultAuthorizationService.requireTechnician();
        KetQuaCdha stored = repository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy kết quả CĐHA"));
        ChiTietChiDinh detail = clsResultAuthorizationService.requireTechnicianClsDetail(
                stored.getIdChiTietChiDinh(), null, "CLS_CHAN_DOAN_HINH_ANH");
        if ("DA_DUYET".equals(stored.getTrangThai())
                || !technician.getMaNhanVien().equals(stored.getMaNhanVienThucHien())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Không thể sửa kết quả đã duyệt hoặc của KTV khác");
        }
        if (!"CHO_DUYET".equals(stored.getTrangThai())
                && !"TU_CHOI".equals(stored.getTrangThai())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Kết quả không ở trạng thái cho phép cập nhật.");
        }
        if (entity == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu dữ liệu kết quả CĐHA");
        }
        stored.setMoTaHinhAnh(entity.getMoTaHinhAnh());
        stored.setKetLuan(entity.getKetLuan());
        stored.setDeNghi(entity.getDeNghi());
        stored.setNgayThucHien(java.time.LocalDateTime.now());
        stored.setMaNhanVienThucHien(technician.getMaNhanVien());
        if ("TU_CHOI".equals(stored.getTrangThai())) {
            stored.setMaBacSiThucHien(null);
        }
        stored.setTrangThai("CHO_DUYET");
        KetQuaCdha saved = repository.save(stored);
        detail.setTrangThaiDv("DA_THUC_HIEN");
        detail.setMaNhanVienThucHien(technician.getMaNhanVien());
        chiTietRepository.save(detail);
        syncAnh(saved.getId(), entity.getDanhSachAnh(), entity.getDuongDanAnh1(), entity.getDuongDanAnh2(), true);
        fillAnh(saved);
        return saved;
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        NhanVien technician = clsResultAuthorizationService.requireTechnician();
        KetQuaCdha stored = repository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy kết quả CĐHA"));
        clsResultAuthorizationService.requireTechnicianClsDetail(
                stored.getIdChiTietChiDinh(), null, "CLS_CHAN_DOAN_HINH_ANH");
        if ("DA_DUYET".equals(stored.getTrangThai())
                || !technician.getMaNhanVien().equals(stored.getMaNhanVienThucHien())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Không thể xóa kết quả đã duyệt hoặc của KTV khác");
        }
        if (!"CHO_DUYET".equals(stored.getTrangThai())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Chỉ được xóa kết quả đang chờ duyệt.");
        }
        hinhAnhKetQuaCdhaRepository.deleteByMaKetQuaCdha(id);
        repository.deleteById(id);
    }

    @Override
    public List<Map<String, Object>> getTodayResults() {
        LocalDate today = TimeUtil.today();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();
        return repository.findResultsTodayWithPatientInfo(start, end);
    }

    @Override
    public List<Map<String, Object>> getTodayResultsByDoctorId(Integer maBacSi) {
        NhanVien doctor = clsResultAuthorizationService.getClsDoctorIfAuthenticated();
        if (doctor != null && !doctor.getMaNhanVien().equals(maBacSi)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Bác sĩ chỉ được xem kết quả được phân công cho mình");
        }
        LocalDate today = TimeUtil.today();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();
        return repository.findResultsTodayWithPatientInfoByDoctorId(maBacSi, start, end);
    }

    @Override
    @Transactional
    public KetQuaCdha updateStatus(Integer id, String status) {
        NhanVien doctor = clsResultAuthorizationService.requireClsDoctor();
        KetQuaCdha entity = repository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy kết quả CĐHA"));
        Integer latestResultId = repository
                .findFirstByIdChiTietChiDinhOrderByNgayThucHienDescIdDesc(entity.getIdChiTietChiDinh())
                .map(KetQuaCdha::getId)
                .orElse(null);
        if (!id.equals(latestResultId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Kết quả không còn là bản ghi hiện hành của chi tiết chỉ định.");
        }
        ChiTietChiDinh detail = clsResultAuthorizationService.requireAuthorizedClsDetail(
                entity.getIdChiTietChiDinh(), doctor, "CLS_CHAN_DOAN_HINH_ANH");
        if (!"DA_DUYET".equals(status) || !"CHO_DUYET".equals(entity.getTrangThai())
                || !"DA_THUC_HIEN".equals(detail.getTrangThaiDv())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Kết quả không ở trạng thái chờ duyệt");
        }
        clsResultAuthorizationService.requireDoctorOwnsPendingResult(
                doctor.getMaNhanVien(), entity.getTrangThai(), entity.getMaBacSiThucHien());
        entity.setTrangThai("DA_DUYET");
        entity.setMaBacSiThucHien(doctor.getMaNhanVien());
        KetQuaCdha saved = repository.save(entity);
        fillAnh(saved);
        return saved;
    }

    private void fillAnh(KetQuaCdha kq) {
        if (kq == null || kq.getId() == null) return;
        List<String> urls = hinhAnhKetQuaCdhaRepository.findByMaKetQuaCdhaOrderByThuTuAsc(kq.getId())
                .stream().map(HinhAnhKetQuaCdha::getDuongDanAnh)
                .filter(u -> u != null && !u.trim().isEmpty()).toList();
        kq.setDuongDanAnh1(urls.size() > 0 ? urls.get(0) : null);
        kq.setDuongDanAnh2(urls.size() > 1 ? urls.get(1) : null);
        kq.setDanhSachAnh(urls);
    }

    private void syncAnh(Integer maKetQua, List<String> danhSachAnh, String a1, String a2, boolean replace) {
        List<String> urls = new java.util.ArrayList<>();
        if (danhSachAnh != null) {
            for (String s : danhSachAnh) if (s != null && !s.trim().isEmpty()) urls.add(s.trim());
        }
        if (urls.isEmpty()) {
            if (a1 != null && !a1.trim().isEmpty()) urls.add(a1.trim());
            if (a2 != null && !a2.trim().isEmpty()) urls.add(a2.trim());
        }
        if (replace) hinhAnhKetQuaCdhaRepository.deleteByMaKetQuaCdha(maKetQua);
        List<HinhAnhKetQuaCdha> ds = new java.util.ArrayList<>();
        int thuTu = 0;
        for (String u : urls) {
            HinhAnhKetQuaCdha h = new HinhAnhKetQuaCdha();
            h.setMaKetQuaCdha(maKetQua);
            h.setDuongDanAnh(u);
            h.setThuTu(thuTu++);
            h.setNgayTao(java.time.LocalDateTime.now());
            ds.add(h);
        }
        if (!ds.isEmpty()) hinhAnhKetQuaCdhaRepository.saveAll(ds);
    }
}