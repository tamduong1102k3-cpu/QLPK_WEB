package com.qlpk.backend.service.impl;

import com.qlpk.backend.dto.CheckInRequest;
import com.qlpk.backend.entity.*;
import com.qlpk.backend.payment.WebSocketPublisher;
import com.qlpk.backend.repository.*;
import com.qlpk.backend.service.PhieuKhamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class PhieuKhamServiceImpl implements PhieuKhamService {

    @Autowired
    private PhieuKhamRepository repository;

    @Autowired
    private DangKyKhamBenhRepository dangKyRepository;

    @Autowired
    private ChuyenKhoaRepository chuyenKhoaRepository;

    @Autowired
    private PhieuChiDinhRepository phieuChiDinhRepository;

    @Autowired
    private ChiTietChiDinhRepository chiTietRepository;

    @Autowired
    private DichVuRepository dichVuRepository;

    @Autowired
    private KetQuaXetNghiemRepository ketQuaXetNghiemRepository;

    @Autowired
    private KetQuaCdhaRepository ketQuaCdhaRepository;

    @Autowired
    private TiepNhanClsRepository tiepNhanClsRepository;

    @Autowired
    private WebSocketPublisher webSocketPublisher;

    @Autowired
    private LichKhamRepository lichKhamRepository;

    @Autowired
    private BenhNhanRepository benhNhanRepository;

    @Override
    public List<PhieuKham> getAll() {
        return repository.findAll();
    }

    @Override
    public PhieuKham getById(Integer id) {
        return repository.findById(id).orElse(null);
    }

    @Override
public List<Map<String, Object>> getAssistantHistory(Integer maChuyenKhoa) {
    return repository.findAssistantHistory(maChuyenKhoa);
}

    @Override
    @Transactional
    public PhieuKham create(PhieuKham entity) {
        if (entity.getNgayKham() == null) {
            entity.setNgayKham(LocalDateTime.now());
        }
        if (entity.getNgayTao() == null) {
            entity.setNgayTao(LocalDateTime.now());
        }
        if (entity.getTrangThai() == null) {
            entity.setTrangThai("CHO");
        }

        if (entity.getMaBenhNhan() != null && entity.getMaChuyenKhoa() != null) {
            List<PhieuKham> existing = repository.findByMaBenhNhanAndMaChuyenKhoaAndNgayKhamBetween(
                entity.getMaBenhNhan(),
                entity.getMaChuyenKhoa(),
                entity.getNgayKham().withHour(0).withMinute(0).withSecond(0),
                entity.getNgayKham().withHour(23).withMinute(59).withSecond(59)
            );
            if (existing != null && !existing.isEmpty()) {
                PhieuKham unfinished = null;
                for (PhieuKham pk : existing) {
                    if (!"HOAN_THANH".equals(pk.getTrangThai())) {
                        unfinished = pk;
                        break;
                    }
                }
                if (unfinished != null) {
                    return unfinished;
                }
            }
        }

        PhieuKham saved = repository.save(entity);
        webSocketPublisher.publishPhieuKhamChange("CREATED", saved);

        return saved;
    }

    @Override
    public PhieuKham update(Integer id, PhieuKham entity) {
        return repository.findById(id).map(existing -> {
            if (entity.getMaNhanVien() != null) existing.setMaNhanVien(entity.getMaNhanVien());
            if (entity.getMaChuyenKhoa() != null) existing.setMaChuyenKhoa(entity.getMaChuyenKhoa());
            if (entity.getTrangThai() != null) existing.setTrangThai(entity.getTrangThai());
            if (entity.getGhiChu() != null) existing.setGhiChu(entity.getGhiChu());

            PhieuKham saved = repository.save(existing);
            webSocketPublisher.publishPhieuKhamChange("UPDATED", saved);
            return saved;
        }).orElse(null);
    }

    @Override
    public void delete(Integer id) {
        repository.deleteById(id);
    }

    @Override
    public List<PhieuKham> getToday() {
        LocalDateTime start = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime end = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59);
        return repository.findByNgayKhamBetween(start, end);
    }

    @Override
    @Transactional
    public Map<String, Object> fullCheckIn(CheckInRequest request) throws Exception {
        if (request.getMaBenhNhan() == null || request.getMaChuyenKhoa() == null) {
            throw new Exception("Thiếu mã bệnh nhân hoặc chuyên khoa");
        }

        ChuyenKhoa ck = chuyenKhoaRepository.findById(request.getMaChuyenKhoa()).orElse(null);
        if (ck == null) {
            throw new Exception("Không tìm thấy chuyên khoa");
        }
        String tenCK = ck.getTenChuyenKhoa().toLowerCase();

        if (ck.getSoLuongToiDa() != null && ck.getSoLuongToiDa() > 0) {
            LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
            LocalDateTime endOfDay = startOfDay.plusDays(1);
            long todayCount = dangKyRepository.countTodayRegistrationsByChuyenKhoa(startOfDay, endOfDay, request.getMaChuyenKhoa());
            if (todayCount >= ck.getSoLuongToiDa()) {
                throw new Exception("Chuyên khoa '" + ck.getTenChuyenKhoa() + "' đã đạt số lượng tối đa hôm nay (" + ck.getSoLuongToiDa() + "). Vui lòng chọn chuyên khoa khác hoặc quay lại vào ngày mai.");
            }
        }

        DangKyKhamBenh dk = new DangKyKhamBenh();
        dk.setMaBenhNhan(request.getMaBenhNhan());
        dk.setMaNhanVien(request.getMaNhanVienLeTan());
        dk.setMaChuyenKhoa(request.getMaChuyenKhoa());
        dk.setThoiGianDangKy(LocalDateTime.now());
        dk.setTrangThai("CHO_KHAM");
        dk.setMaDichVu(request.getMaDichVu());

        String note = request.getGhiChu();
        if (request.getMaDichVu() != null) {
            note = "[Dịch vụ ID: " + request.getMaDichVu() + "] " + (note != null ? note : "");
        }
        dk.setGhiChu(note);

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        long count = dangKyRepository.countTodayRegistrations(startOfDay, endOfDay);
        dk.setSoThuTu((int)count + 1);

        DangKyKhamBenh savedDk = dangKyRepository.saveAndFlush(dk);
        webSocketPublisher.publishDangKyKhamChange("CREATED", savedDk.getId(), savedDk.getTrangThai());

        if (Boolean.TRUE.equals(request.getXacNhanCccd())) {
            benhNhanRepository.findById(request.getMaBenhNhan()).ifPresent(bn -> {
                bn.setDaXacMinhDanhTinh(true);
                benhNhanRepository.save(bn);
            });
        }

        return Map.of(
            "message", "Tiếp đón thành công",
            "soThuTu", dk.getSoThuTu(),
            "hasPhieuKham", false
        );
    }

    @Override
    @Transactional
    public Map<String, Object> acceptPatient(Integer registrationId, Integer assistantId) throws Exception {
        DangKyKhamBenh dk = dangKyRepository.findById(registrationId).orElse(null);
        if (dk == null) {
            throw new Exception("Không tìm thấy hồ sơ đăng ký khám");
        }
        if (dk.getMaPhieuKham() != null) {
            throw new Exception("Bệnh nhân này đã có phiếu khám");
        }

        PhieuKham pk = new PhieuKham();
        pk.setMaBenhNhan(dk.getMaBenhNhan());
        pk.setMaChuyenKhoa(dk.getMaChuyenKhoa());
        pk.setMaNhanVien(assistantId != null ? assistantId : dk.getMaNhanVien()); 
        pk.setNgayKham(LocalDateTime.now());
        pk.setNgayTao(LocalDateTime.now());
        pk.setTrangThai("CHO");
        pk.setMaDichVu(dk.getMaDichVu());
        PhieuKham savedPk = repository.saveAndFlush(pk);
        webSocketPublisher.publishPhieuKhamChange("CREATED", savedPk);

        dk.setMaPhieuKham(savedPk.getMaPhieuKham());
        dk.setTrangThai("DANG_KHAM");
        dangKyRepository.saveAndFlush(dk);
        webSocketPublisher.publishDangKyKhamChange("UPDATED", dk.getId(), dk.getTrangThai());

        return Map.of(
            "message", "Đã tạo phiếu khám thành công", 
            "phieuKhamId", savedPk.getMaPhieuKham(),
            "registration", dk
        );
    }

    @Override
    public List<Map<String, Object>> getHistory(Integer maBacSi) {
        return repository.findHistoryDetailed(maBacSi);
    }

    @Override
@Transactional
public void updateToWaitingForDoctor(Integer maPhieuKham) throws Exception {
    PhieuKham pk = repository.findById(maPhieuKham)
            .orElseThrow(() -> new Exception("Không tìm thấy phiếu khám #" + maPhieuKham));
    pk.setTrangThai("CHO_BAC_SI");
    repository.save(pk);
    webSocketPublisher.publishPhieuKhamChange("UPDATED", pk);

    dangKyRepository.findByMaPhieuKham(maPhieuKham).ifPresent(dk -> {
        dk.setTrangThai("CHO_BAC_SI");
        dangKyRepository.save(dk);
        webSocketPublisher.publishDangKyKhamChange("UPDATED", dk.getId(), dk.getTrangThai());
    });
}

    @Override
    @Transactional
    public void updateToChoCls(Integer maPhieuKham) throws Exception {
        PhieuKham pk = repository.findById(maPhieuKham)
                .orElseThrow(() -> new Exception("Không tìm thấy phiếu khám #" + maPhieuKham));
        pk.setTrangThai("CHO_CLS");
        repository.save(pk);
        webSocketPublisher.publishPhieuKhamChange("UPDATED", pk);

        dangKyRepository.findByMaPhieuKham(maPhieuKham).ifPresent(dk -> {
            dk.setTrangThai("CHO_CLS");
            dangKyRepository.save(dk);
            webSocketPublisher.publishDangKyKhamChange("UPDATED", dk.getId(), dk.getTrangThai());
        });
    }

    @Override
    @Transactional
    public void finishConsultation(Integer maPhieuKham) throws Exception {
        PhieuKham pk = repository.findById(maPhieuKham).orElse(null);
        if (pk == null) throw new Exception("Không tìm thấy phiếu khám");

        pk.setTrangThai("HOAN_THANH");
        repository.save(pk);
        webSocketPublisher.publishPhieuKhamChange("UPDATED", pk);

        dangKyRepository.findByMaPhieuKham(maPhieuKham).ifPresent(dk -> {
            dk.setTrangThai("HOAN_THANH");
            dangKyRepository.save(dk);
            webSocketPublisher.publishDangKyKhamChange("UPDATED", dk.getId(), dk.getTrangThai());

            lichKhamRepository.findByMaDangKyKhamBenh(dk.getId()).ifPresent(lk -> {
                lk.setTrangThai("HOAN_THANH");
                lichKhamRepository.save(lk);
            });
        });

        phieuChiDinhRepository.findByMaPhieuKham(maPhieuKham).forEach(pcd -> {
            List<ChiTietChiDinh> allDetails = chiTietRepository.findByMaPhieuChiDinh(pcd.getMaPhieuChiDinh());
            boolean allDone = allDetails.stream().allMatch(ct -> "DA_THUC_HIEN".equals(ct.getTrangThaiDv()));
            if (allDone) {
                pcd.setTrangThai("HOAN_THANH");
                phieuChiDinhRepository.save(pcd);
            }
        });
    }

    @Override
    public List<Map<String, Object>> getCompletedPatientsToday() {
        return repository.findCompletedPatientsToday();
    }

    @Override
    public List<Map<String, Object>> getCompletedPatientsTodayWithSearch(String keyword) {
        return repository.findCompletedPatientsTodayWithSearch(keyword);
    }

    @Override
    public List<Map<String, Object>> getHistoryByChuyenKhoaAllDays(Integer maChuyenKhoa) {
        return repository.findHistoryByChuyenKhoaAllDays(maChuyenKhoa);
    }

    @Override
    @Transactional
    public Map<String, Object> acceptClsPatient(Integer registrationId, Integer technicianId) throws Exception {
        DangKyKhamBenh dk = dangKyRepository.findById(registrationId).orElse(null);
        if (dk == null) {
            throw new Exception("Không tìm thấy hồ sơ đăng ký khám");
        }
        if (dk.getMaPhieuKham() != null) {
            throw new Exception("Bệnh nhân này đã được tiếp nhận");
        }

        PhieuKham pk = new PhieuKham();
        pk.setMaBenhNhan(dk.getMaBenhNhan());
        pk.setMaChuyenKhoa(dk.getMaChuyenKhoa());
        pk.setMaNhanVien(technicianId != null ? technicianId : dk.getMaNhanVien());
        pk.setNgayKham(LocalDateTime.now());
        pk.setNgayTao(LocalDateTime.now());
        pk.setTrangThai("CHO");
        pk.setMaDichVu(dk.getMaDichVu());
        pk.setGhiChu(dk.getGhiChu());
        PhieuKham savedPk = repository.saveAndFlush(pk);
        webSocketPublisher.publishPhieuKhamChange("CREATED", savedPk);

        dk.setMaPhieuKham(savedPk.getMaPhieuKham());
        dk.setTrangThai("DANG_KHAM");
        dangKyRepository.saveAndFlush(dk);
        webSocketPublisher.publishDangKyKhamChange("UPDATED", dk.getId(), dk.getTrangThai());

        return Map.of(
            "message", "Đã tiếp nhận bệnh nhân CLS thành công",
            "phieuKhamId", savedPk.getMaPhieuKham(),
            "registration", dk
        );
    }

    @Override
    @Transactional
    public Map<String, Object> techConfirmClsService(Integer maPhieuKham, Integer technicianId, String lyDoDen, String thongTinSangLoc, String ghiChu) throws Exception {
        PhieuKham pk = repository.findById(maPhieuKham)
                .orElseThrow(() -> new Exception("Không tìm thấy phiếu khám #" + maPhieuKham));

        if (pk.getMaDichVu() == null) {
            throw new Exception("Phiếu khám này không có dịch vụ CLS");
        }

        TiepNhanCls tiepNhan = new TiepNhanCls();
        tiepNhan.setMaPhieuKham(maPhieuKham);
        tiepNhan.setLyDoDen(lyDoDen);
        tiepNhan.setThongTinSangLoc(thongTinSangLoc);
        tiepNhan.setGhiChu(ghiChu);
        tiepNhanClsRepository.save(tiepNhan);

        List<PhieuChiDinh> existingPcd = phieuChiDinhRepository.findByMaPhieuKham(maPhieuKham);
        if (existingPcd != null && !existingPcd.isEmpty()) {
            throw new Exception("Phiếu chỉ định đã được tạo trước đó cho phiếu khám này");
        }

        DichVu dv = dichVuRepository.findById(pk.getMaDichVu()).orElse(null);
        Double donGia = (dv != null && dv.getDonGia() != null) ? dv.getDonGia().doubleValue() : 0.0;

        PhieuChiDinh pcd = new PhieuChiDinh();
        pcd.setMaPhieuKham(maPhieuKham);
        pcd.setMaNhanVienChiDinh(technicianId);
        pcd.setNgayChiDinh(LocalDateTime.now());
        pcd.setTongTien(donGia);
        PhieuChiDinh savedPcd = phieuChiDinhRepository.saveAndFlush(pcd);

        ChiTietChiDinh ct = new ChiTietChiDinh();
        ct.setMaPhieuChiDinh(savedPcd.getMaPhieuChiDinh());
        ct.setMaDichVu(pk.getMaDichVu());
        ct.setSoLuong(1);
        ct.setDonGia(donGia);
        ct.setTrangThaiDv("CHUA_THUC_HIEN");
        chiTietRepository.saveAndFlush(ct);

        pk.setTrangThai("CHO_CLS");
        repository.save(pk);
        webSocketPublisher.publishPhieuKhamChange("UPDATED", pk);

        dangKyRepository.findByMaPhieuKham(maPhieuKham).ifPresent(dk -> {
            dk.setTrangThai("CHO_CLS");
            dangKyRepository.save(dk);
            webSocketPublisher.publishDangKyKhamChange("UPDATED", dk.getId(), dk.getTrangThai());
        });

        return Map.of(
            "message", "Đã tiếp nhận CLS và tạo phiếu chỉ định thành công",
            "phieuChiDinhId", savedPcd.getMaPhieuChiDinh()
        );
    }

    @Override
    @Transactional
    public Map<String, Object> confirmClsService(Integer maPhieuKham, Integer doctorId) throws Exception {
        PhieuKham pk = repository.findById(maPhieuKham)
                .orElseThrow(() -> new Exception("Không tìm thấy phiếu khám #" + maPhieuKham));

        if (pk.getMaDichVu() == null) {
            throw new Exception("Phiếu khám này không có dịch vụ CLS để xác nhận");
        }

        List<PhieuChiDinh> existingPcd = phieuChiDinhRepository.findByMaPhieuKham(maPhieuKham);
        if (existingPcd != null && !existingPcd.isEmpty()) {
            throw new Exception("Phiếu chỉ định đã được tạo trước đó cho phiếu khám này");
        }

        DichVu dv = dichVuRepository.findById(pk.getMaDichVu()).orElse(null);
        Double donGia = (dv != null && dv.getDonGia() != null) ? dv.getDonGia().doubleValue() : 0.0;

        PhieuChiDinh pcd = new PhieuChiDinh();
        pcd.setMaPhieuKham(maPhieuKham);
        pcd.setMaNhanVienChiDinh(doctorId);
        pcd.setNgayChiDinh(LocalDateTime.now());
        pcd.setTongTien(donGia);
        PhieuChiDinh savedPcd = phieuChiDinhRepository.saveAndFlush(pcd);

        ChiTietChiDinh ct = new ChiTietChiDinh();
        ct.setMaPhieuChiDinh(savedPcd.getMaPhieuChiDinh());
        ct.setMaDichVu(pk.getMaDichVu());
        ct.setSoLuong(1);
        ct.setDonGia(donGia);
        ct.setTrangThaiDv("CHUA_THUC_HIEN");
        chiTietRepository.saveAndFlush(ct);

        pk.setTrangThai("CHO_CLS");
        repository.save(pk);
        webSocketPublisher.publishPhieuKhamChange("UPDATED", pk);

        dangKyRepository.findByMaPhieuKham(maPhieuKham).ifPresent(dk -> {
            dk.setTrangThai("CHO_CLS");
            dangKyRepository.save(dk);
            webSocketPublisher.publishDangKyKhamChange("UPDATED", dk.getId(), dk.getTrangThai());
        });

        return Map.of(
            "message", "Đã xác nhận thực hiện dịch vụ và tạo phiếu chỉ định thành công",
            "phieuChiDinhId", savedPcd.getMaPhieuChiDinh()
        );
    }

    @Override
    public List<Map<String, Object>> getPendingClsConfirmation(Integer maChuyenKhoa) {
        return repository.findPendingClsConfirmation(maChuyenKhoa);
    }

    @Override
    public List<Map<String, Object>> getAvailableClsResults(Integer maPhieuKham) {
        List<Map<String, Object>> results = new java.util.ArrayList<>();
        List<PhieuChiDinh> pcdList = phieuChiDinhRepository.findByMaPhieuKham(maPhieuKham);
        if (pcdList == null) return results;

        for (PhieuChiDinh pcd : pcdList) {
            List<ChiTietChiDinh> details = chiTietRepository.findByMaPhieuChiDinh(pcd.getMaPhieuChiDinh());
            if (details == null) continue;

            for (ChiTietChiDinh detail : details) {
                if ("DA_THUC_HIEN".equals(detail.getTrangThaiDv())) {
                    var kqxnOpt = ketQuaXetNghiemRepository.findByMaChiTietChiDinh(detail.getId());
                    if (kqxnOpt.isPresent() && "DA_DUYET".equals(kqxnOpt.get().getTrangThai())) {
                        String tenDv = dichVuRepository.findById(detail.getMaDichVu())
                                .map(DichVu::getTenDichVu).orElse("Dịch vụ xét nghiệm");
                        Map<String, Object> map = new java.util.HashMap<>();
                        map.put("id", detail.getId());
                        map.put("loai", "XET_NGHIEM");
                        map.put("tenDichVu", tenDv);
                        results.add(map);
                        continue;
                    }

                    var kqcdhaOpt = ketQuaCdhaRepository.findByIdChiTietChiDinh(detail.getId());
                    if (kqcdhaOpt.isPresent() && "DA_DUYET".equals(kqcdhaOpt.get().getTrangThai())) {
                        String tenDv = dichVuRepository.findById(detail.getMaDichVu())
                                .map(DichVu::getTenDichVu).orElse("Dịch vụ CĐHA");
                        Map<String, Object> map = new java.util.HashMap<>();
                        map.put("id", detail.getId());
                        map.put("loai", "CDHA");
                        map.put("tenDichVu", tenDv);
                        results.add(map);
                    }
                }
            }
        }
        return results;
    }

    @Override
    public List<Map<String, Object>> getHistoryByBenhNhan(Integer maBenhNhan, Integer maChuyenKhoa) {
        return repository.findHistoryByBenhNhan(maBenhNhan, maChuyenKhoa);
    }
}
