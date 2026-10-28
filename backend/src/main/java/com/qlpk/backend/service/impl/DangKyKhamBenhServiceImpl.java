package com.qlpk.backend.service.impl;

import com.qlpk.backend.dto.CreateDangKyKhamBenhRequest;
import com.qlpk.backend.entity.BenhNhan;
import com.qlpk.backend.entity.DangKyKhamBenh;
import com.qlpk.backend.entity.DichVu;
import com.qlpk.backend.entity.LichKham;
import com.qlpk.backend.payment.WebSocketPublisher;
import com.qlpk.backend.repository.BenhNhanRepository;
import com.qlpk.backend.repository.DangKyKhamBenhRepository;
import com.qlpk.backend.repository.DichVuRepository;
import com.qlpk.backend.repository.LichKhamRepository;
import com.qlpk.backend.repository.PhieuKhamRepository;
import com.qlpk.backend.service.DangKyKhamBenhService;
import com.qlpk.backend.service.HanMucPhongService;
import com.qlpk.backend.util.TimeUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class DangKyKhamBenhServiceImpl implements DangKyKhamBenhService {

    @Autowired
    private DangKyKhamBenhRepository repository;

    @Autowired
    private PhieuKhamRepository phieuKhamRepository;

    @Autowired
    private WebSocketPublisher webSocketPublisher;

    @Autowired
    private LichKhamRepository lichKhamRepository;

    @Autowired
    private DichVuRepository dichVuRepository;

    @Autowired
    private BenhNhanRepository benhNhanRepository;

    @Autowired
    private HanMucPhongService hanMucPhongService;

    @Override
    public List<DangKyKhamBenh> getAll() {
        return repository.findAll();
    }

    @Override
    public DangKyKhamBenh getById(Integer id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    @Transactional
    public DangKyKhamBenh create(CreateDangKyKhamBenhRequest request) {
        // Optimistic concurrency check: Lễ tân không được tiếp đón dựa trên dịch vụ đã cũ
        if (request.getMaDichVu() != null) {
            DichVu dichVu = dichVuRepository.findById(request.getMaDichVu())
                    .orElseThrow(() -> new ObjectOptimisticLockingFailureException(
                        DangKyKhamBenh.class, request.getMaDichVu()));
            Long clientVersion = request.getVersion();
            if (clientVersion == null || !clientVersion.equals(dichVu.getVersion())) {
                throw new ObjectOptimisticLockingFailureException(
                        DichVu.class, request.getMaDichVu());
            }
        }

        if (request.getMaPhong() != null) {
            hanMucPhongService.giuChoPhong(request.getMaPhong(), TimeUtil.today());
        }

        DangKyKhamBenh entity = new DangKyKhamBenh();
        entity.setMaBenhNhan(request.getMaBenhNhan());
        entity.setMaNhanVien(request.getMaNhanVien());
        entity.setMaChuyenKhoa(request.getMaChuyenKhoa());
        entity.setMaPhong(request.getMaPhong());
        entity.setMaDichVu(request.getMaDichVu());
        entity.setGhiChu(request.getGhiChu());

        if (entity.getThoiGianDangKy() == null) {
            entity.setThoiGianDangKy(TimeUtil.now());
        }
        if (entity.getTrangThai() == null) {
            entity.setTrangThai("CHO_KHAM");
        }
        LocalDateTime startOfDay = TimeUtil.today().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        // Tính số thứ tự an toàn hơn: dùng MAX(so_thu_tu) + 1 thay vì COUNT(*) + 1
        // để tránh trùng số khi có hủy/đã khám trong ngày.
        // Số thứ tự cấp độc lập theo (ngày, ma_phong) — mỗi phòng có dãy số riêng.
        if (entity.getSoThuTu() == null) {
            if (entity.getMaPhong() == null) {
                throw new RuntimeException("Thiếu thông tin phòng để cấp số thứ tự.");
            }
            Integer maxSoThuTu = repository.findMaxSoThuTuByPhong(startOfDay, endOfDay, entity.getMaPhong());
            entity.setSoThuTu((maxSoThuTu == null ? 0 : maxSoThuTu) + 1);
        }
        DangKyKhamBenh saved = repository.save(entity);
        if (webSocketPublisher != null) {
            webSocketPublisher.publishDangKyKhamChange("CREATED", saved.getId(), saved.getTrangThai());
        }

        // Nếu có maLichKham -> check-in atomic cho PENDING/QUA_HEN; không cho phép check-in nếu trạng thái đã đổi khác.
        if (request.getMaLichKham() != null) {
            int rows = lichKhamRepository.checkInIfEligible(request.getMaLichKham(), saved.getId());
            if (rows == 0) {
                throw new RuntimeException("Lịch hẹn không còn ở trạng thái có thể check-in (có thể đã check-in hoặc hủy trước đó).");
            }
        }

        // Nếu lễ tân đã đối chiếu CCCD thành công trong lúc tiếp đón → đánh dấu đã xác minh danh tính
        if (Boolean.TRUE.equals(request.getXacNhanCccd()) && request.getMaBenhNhan() != null) {
            benhNhanRepository.findById(request.getMaBenhNhan()).ifPresent(bn -> {
                bn.setDaXacMinhDanhTinh(true);
                benhNhanRepository.save(bn);
            });
        }

        return saved;
    }

    @Override
    public DangKyKhamBenh update(Integer id, DangKyKhamBenh entity) {
        if (repository.existsById(id)) {
            DangKyKhamBenh saved = repository.save(entity);
            if (webSocketPublisher != null) {
                webSocketPublisher.publishDangKyKhamChange("UPDATED", saved.getId(), saved.getTrangThai());
            }
            return saved;
        }
        return null;
    }

    @Override
    public void delete(Integer id) {
        repository.deleteById(id);
    }

    @Override
    public List<Map<String, Object>> getTodayRegistrationsDetailed() {
        LocalDateTime startOfDay = TimeUtil.today().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        return repository.findTodayRegistrationsDetailed(startOfDay, endOfDay);
    }

    @Override
    public List<Map<String, Object>> getTodayRegistrationsDetailedWithSearch(String keyword) {
        LocalDateTime startOfDay = TimeUtil.today().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        return repository.findTodayRegistrationsDetailedWithSearch(startOfDay, endOfDay, keyword);
    }

    @Override
    @Transactional
    public DangKyKhamBenh updateStatus(Integer id, String status) {
        return repository.findById(id).map(dangKy -> {
            String trangThaiCu = dangKy.getTrangThai();

            // GATE THỨ NHẤT: cập nhật trạng thái phải thành công trước mới giải phóng slot.
            // Nếu trạng thái đã đổi từ trước đó, ROW_COUNT() = 0 và không release lần thứ hai.
            int updatedRows = repository.updateTrangThaiIfCurrent(id, status, trangThaiCu);
            if (updatedRows == 0) {
                return repository.findById(id).orElse(null);
            }

            // Chỉ khi update trạng thái thành công mới giải phóng slot theo phòng.
            if (isGiaiPhongSlot(trangThaiCu, status) && dangKy.getMaPhong() != null) {
                hanMucPhongService.giaiPhongPhong(dangKy.getMaPhong(), TimeUtil.today());
            }

            DangKyKhamBenh saved = repository.findById(id).orElse(dangKy);
            if (webSocketPublisher != null) {
                webSocketPublisher.publishDangKyKhamChange("UPDATED", saved.getId(), saved.getTrangThai());
            }
            return saved;
        }).orElse(null);
    }

    /**
     * Chỉ giải phóng khi trạng thái đã giữ chỗ và thực sự rời khỏi danh sách chờ do hủy/vắng mặt.
     */
    private boolean isGiaiPhongSlot(String trangThaiCu, String trangThaiMoi) {
        if (trangThaiCu == null || trangThaiMoi == null) return false;
        boolean dangGiuSlot = List.of("CHO_KHAM", "DANG_KHAM").contains(trangThaiCu);
        boolean chuyenSangGiaiPhong = List.of("VANG_MAT", "HUY").contains(trangThaiMoi);
        return dangGiuSlot && chuyenSangGiaiPhong;
    }

}
