package com.qlpk.backend.service.impl;

import com.qlpk.backend.dto.ReferralRequest;
import com.qlpk.backend.entity.*;
import com.qlpk.backend.repository.*;
import com.qlpk.backend.service.PhieuChiDinhService;
import com.qlpk.backend.service.HanMucPhongService;
import com.qlpk.backend.service.ClsResultAuthorizationService;
import com.qlpk.backend.payment.WebSocketPublisher;
import com.qlpk.backend.util.TimeUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * Lớp triển khai nghiệp vụ phiếu chỉ định: quản lý phiếu chỉ định dịch vụ CLS
 * (xét nghiệm, chẩn đoán hình ảnh), tiếp nhận kết quả từ kỹ thuật viên,
 * duyệt/từ chối kết quả và đồng bộ trạng thái phiếu khám.
 */
@Service
public class PhieuChiDinhServiceImpl implements PhieuChiDinhService {

    @Autowired private PhieuChiDinhRepository repository;
    @Autowired private ChiTietChiDinhRepository chiTietRepository;
    @Autowired private KetQuaXetNghiemRepository ketQuaXetNghiemRepository;
    @Autowired private ChiTietKetQuaXnRepository chiTietKetQuaXnRepository;
    @Autowired private ChiTietXetNghiemRepository chiTietXetNghiemRepository;
    @Autowired private KetQuaCdhaRepository ketQuaCdhaRepository;
    @Autowired private HinhAnhKetQuaCdhaRepository hinhAnhKetQuaCdhaRepository;
    @Autowired private DangKyKhamBenhRepository dangKyKhamBenhRepository;
    @Autowired private DichVuRepository dichVuRepository;
    @Autowired private PhieuKhamRepository phieuKhamRepository;
    @Autowired private WebSocketPublisher webSocketPublisher;
    @Autowired private LichKhamRepository lichKhamRepository;
    @Autowired private NhanVienRepository nhanVienRepository;
    @Autowired private HanMucPhongService hanMucPhongService;
    @Autowired private ClsResultAuthorizationService clsResultAuthorizationService;
    @PersistenceContext private EntityManager entityManager;

    /** Lấy danh sách toàn bộ phiếu chỉ định. */
    @Override public List<PhieuChiDinh> getAll() { return repository.findAll(); }
    /** Lấy phiếu chỉ định theo mã; trả về {@code null} nếu không tồn tại. */
    @Override public PhieuChiDinh getById(Integer id) { return repository.findById(id).orElse(null); }
    /** Tạo mới và lưu phiếu chỉ định. */
    @Override public PhieuChiDinh create(PhieuChiDinh entity) { return repository.save(entity); }
    /** Cập nhật phiếu chỉ định theo mã. */
    @Override public PhieuChiDinh update(Integer id, PhieuChiDinh entity) { return repository.save(entity); }
    /** Xoá phiếu chỉ định theo mã. */
    @Override public void delete(Integer id) { repository.deleteById(id); }

    /**
     * Lấy danh sách xét nghiệm đang chờ thực hiện theo chuyên khoa.
     *
     * @param maChuyenKhoa mã chuyên khoa cần lọc
     * @return danh sách kết quả chờ (mỗi phần tử là một bản ghi kết quả)
     */
    @Override
    public List<Map<String, Object>> getPendingTests(Integer maChuyenKhoa) {
        LocalDate today = TimeUtil.today();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();
        return repository.findPendingTests(maChuyenKhoa, start, end);
    }

    /**
     * Lấy danh sách xét nghiệm đã hoàn thành trong ngày theo chuyên khoa.
     *
     * @param maChuyenKhoa mã chuyên khoa cần lọc
     * @return danh sách kết quả đã hoàn tất hôm nay
     */
    @Override
    public List<Map<String, Object>> getCompletedTestsToday(Integer maChuyenKhoa) {
        LocalDate today = TimeUtil.today();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();
        return repository.findCompletedTestsToday(maChuyenKhoa, start, end);
    }

    /**
     * Tiếp nhận kết quả xét nghiệm / chẩn đoán hình ảnh do kỹ thuật viên gửi lên.
     * <p>
     * Cập nhật trạng thái dịch vụ sang {@code DA_THUC_HIEN}, sau đó phân nhánh:
     * dịch vụ hình ảnh (CĐHA) sẽ lưu vào {@code ket_qua_cdha} kèm gallery ảnh,
     * còn lại lưu vào {@code ket_qua_xet_nghiem} kèm chi tiết từng chỉ số.
     * </p>
     *
     * @param body dữ liệu kết quả gồm {@code id}, {@code maPhieuKham}, {@code ketQua}
     *             và các trường tuỳ chọn (template, ảnh, chỉ số); mã KTV lấy từ phiên đăng nhập
     * @throws Exception khi thiếu thông tin bắt buộc hoặc không tìm thấy chi tiết chỉ định
     */
    @Override
    @Transactional
    public void submitTestResult(Map<String, Object> body) throws Exception {
        NhanVien technician = clsResultAuthorizationService.requireTechnician();
        if (body == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu dữ liệu kết quả CLS");
        }
        Integer detailId = null;
        Integer maPhieuKham = null;
        try {
            if (body.get("id") != null) detailId = Integer.valueOf(body.get("id").toString());
            if (body.get("maPhieuKham") != null) maPhieuKham = Integer.valueOf(body.get("maPhieuKham").toString());
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã chi tiết hoặc phiếu khám không hợp lệ");
        }
        String ketQua = (String) body.get("ketQua");
        Integer maNhanVienThucHien = technician.getMaNhanVien();
        if (detailId == null || ketQua == null) {
            throw new Exception("Thiếu thông tin bắt buộc");
        }

        ChiTietChiDinh detail = clsResultAuthorizationService.requireTechnicianClsDetail(
                detailId, maPhieuKham, null);
        DichVu dv = dichVuRepository.findById(detail.getMaDichVu())
                .orElseThrow(() -> new Exception("Không tìm thấy dịch vụ của chi tiết chỉ định"));

        boolean isCdha = "CLS_CHAN_DOAN_HINH_ANH".equals(dv.getLoaiDichVu());
        KetQuaCdha existingCdha = null;
        KetQuaXetNghiem existingXetNghiem = null;
        if (isCdha) {
            existingCdha = ketQuaCdhaRepository
                    .findFirstByIdChiTietChiDinhOrderByNgayThucHienDescIdDesc(detailId).orElse(null);
            if (existingCdha != null) {
                String status = existingCdha.getTrangThai();
                if ("DA_DUYET".equals(status)) {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT, "Kết quả đã được duyệt, không thể ghi đè từ luồng KTV.");
                }
                if (!"CHO_DUYET".equals(status) && !"TU_CHOI".equals(status)) {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT, "Kết quả không ở trạng thái cho phép cập nhật.");
                }
            }
        } else {
            existingXetNghiem = ketQuaXetNghiemRepository
                    .findFirstByMaChiTietChiDinhOrderByNgayThucHienDescIdDesc(detailId).orElse(null);
            if (existingXetNghiem != null) {
                String status = existingXetNghiem.getTrangThai();
                if ("DA_DUYET".equals(status)) {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT, "Kết quả đã được duyệt, không thể ghi đè từ luồng KTV.");
                }
                if (!"CHO_DUYET".equals(status) && !"TU_CHOI".equals(status)) {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT, "Kết quả không ở trạng thái cho phép cập nhật.");
                }
            }
        }
        boolean resubmittingRejectedResult = isCdha
                ? existingCdha != null && "TU_CHOI".equals(existingCdha.getTrangThai())
                : existingXetNghiem != null && "TU_CHOI".equals(existingXetNghiem.getTrangThai());

        detail.setTrangThaiDv("DA_THUC_HIEN");
        detail.setMaNhanVienThucHien(maNhanVienThucHien);
        chiTietRepository.save(detail);

        if (isCdha) {
            // ── Xử lý kết quả Chẩn Đoán Hình Ảnh ──
            KetQuaCdha kqcdha = existingCdha != null ? existingCdha : new KetQuaCdha();
            kqcdha.setIdChiTietChiDinh(detailId);
            kqcdha.setNgayThucHien(LocalDateTime.now());
            kqcdha.setMaNhanVienThucHien(maNhanVienThucHien);
            if (resubmittingRejectedResult) {
                kqcdha.setKetLuan(null);
                kqcdha.setDeNghi(null);
                kqcdha.setMaBacSiThucHien(null);
            }

            String anh1 = body.get("duongDanAnh1") != null ? body.get("duongDanAnh1").toString() : null;
            String anh2 = body.get("duongDanAnh2") != null ? body.get("duongDanAnh2").toString() : null;
            // Tương thích ngược: giữ trường tạm để response cũ vẫn có duongDanAnh1/2
            kqcdha.setDuongDanAnh1(anh1);
            kqcdha.setDuongDanAnh2(anh2);
            if (body.get("deNghi") != null) kqcdha.setDeNghi(body.get("deNghi").toString());

            // Nội dung mô tả: ưu tiên templateValues.mo_ta, nếu không có thì dùng ketQua
            String moTa = ketQua;
            Map<String, Object> tVals = null;
            if (body.get("templateValues") != null) {
                tVals = (Map<String, Object>) body.get("templateValues");
                if (tVals.get("mo_ta") != null) moTa = tVals.get("mo_ta").toString();
                if (tVals.get("de_nghi") != null && body.get("deNghi") == null) {
                    kqcdha.setDeNghi(tVals.get("de_nghi").toString());
                }
                if (tVals.get("duong_dan_anh_1") != null) {
                    anh1 = tVals.get("duong_dan_anh_1").toString();
                    kqcdha.setDuongDanAnh1(anh1);
                }
                if (tVals.get("duong_dan_anh_2") != null) {
                    anh2 = tVals.get("duong_dan_anh_2").toString();
                    kqcdha.setDuongDanAnh2(anh2);
                }
            }
            kqcdha.setMoTaHinhAnh(moTa);

            if (!"DA_DUYET".equals(kqcdha.getTrangThai())) {
                kqcdha.setTrangThai("CHO_DUYET");
            }
            KetQuaCdha saved = ketQuaCdhaRepository.save(kqcdha);
            // Ưu tiên danhSachAnh (client mới gửi mảng N ảnh), fallback 2 field cũ
            syncHinhAnhCdha(saved.getId(), body, anh1, anh2);
        } else {
            // ── Xử lý kết quả Xét Nghiệm ──
            KetQuaXetNghiem kqxn = existingXetNghiem != null
                    ? existingXetNghiem : new KetQuaXetNghiem();

            kqxn.setMaChiTietChiDinh(detailId);
            kqxn.setNgayThucHien(LocalDateTime.now());
            kqxn.setNguoiThucHien(maNhanVienThucHien);
            if (resubmittingRejectedResult) {
                kqxn.setMaBsKetLuan(null);
            }
            // Lưu toàn bộ nội dung kết quả (chỉ số + biên bản) do KTV nhập vào cột ket_qua
            kqxn.setKetQua(ketQua);

            if (resubmittingRejectedResult) {
                kqxn.setGhiChuThem(null);
            }
            // Giữ nguyên các trường đã có nếu cập nhật lại (vd ghi_chu_them đã nhập trước)
            if (body.get("ghiChuThem") != null) kqxn.setGhiChuThem(body.get("ghiChuThem").toString());

            kqxn.setTrangThai("CHO_DUYET");

            ketQuaXetNghiemRepository.save(kqxn);

            // ── LƯU CHI TIẾT KẾT QUẢ TỪNG CHỈ SỐ (bảng chi_tiet_ket_qua_xn) ──
            chiTietKetQuaXnRepository.deleteByMaKetQuaXn(kqxn.getId());
            Object listObj = body.get("chiTietKetQua");
            if (listObj instanceof List) {
                for (Object item : (List) listObj) {
                    if (!(item instanceof Map)) continue;
                    Map mItem = (Map) item;
                    Object maSoObj = mItem.get("maChiSo");
                    if (maSoObj == null) maSoObj = mItem.get("maChiTiet");
                    Object giaObj = mItem.get("giaTriNhap");
                    if (maSoObj == null) continue;
                    ChiTietKetQuaXn ct = new ChiTietKetQuaXn();
                    ct.setMaKetQuaXn(kqxn.getId());
                    try {
                        ct.setMaChiSo(Integer.valueOf(maSoObj.toString()));
                    } catch (NumberFormatException e) {
                        continue;
                    }
                    ct.setGiaTri(giaObj != null ? giaObj.toString() : null);
                    chiTietKetQuaXnRepository.save(ct);
                }
            }
        }

        // Phát tín hiệu WebSocket cho CLS
        if (webSocketPublisher != null) {
            String loai = "XET_NGHIEM";
            if (isCdha) {
                loai = "CDHA";
                publishClsChangeAfterCommit("SUBMITTED", maPhieuKham, loai);
            } else {
                webSocketPublisher.publishClsChange("SUBMITTED", maPhieuKham, loai);
            }
        }
    }

    private void publishClsChangeAfterCommit(String action, Integer maPhieuKham, String loai) {
        if (webSocketPublisher == null) return;
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            webSocketPublisher.publishClsChange(action, maPhieuKham, loai);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                webSocketPublisher.publishClsChange(action, maPhieuKham, loai);
            }
        });
    }

    /**
     * Lấy danh sách kết quả chờ duyệt theo chuyên khoa (dành cho bác sĩ chẩn đoán/xét nghiệm).
     *
     * @param maChuyenKhoa mã chuyên khoa cần lọc
     * @return danh sách kết quả đang chờ duyệt
     */
    @Override
    public List<Map<String, Object>> getPendingApprovalList(Integer maChuyenKhoa) {
        LocalDate today = TimeUtil.today();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();
        return repository.findPendingApprovalList(maChuyenKhoa, start, end);
    }

    /**
     * Lấy danh sách kết quả đã duyệt theo chuyên khoa (dành cho bác sĩ chẩn đoán/xét nghiệm).
     *
     * @param maChuyenKhoa mã chuyên khoa cần lọc
     * @return danh sách kết quả đã được duyệt
     */
    @Override
    public List<Map<String, Object>> getApprovedList(Integer maChuyenKhoa) {
        LocalDate today = TimeUtil.today();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();
        return repository.findApprovedList(maChuyenKhoa, start, end);
    }

    @Override
    public Page<Map<String, Object>> getDoctorClsReviewQueue(
            Integer maBacSi, Integer maChuyenKhoa, LocalDate fromDate, LocalDate toDate,
            String trangThaiDv, String trangThaiKq, Integer maDichVu, int page, int size) {
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new IllegalArgumentException("Ngày bắt đầu không được sau ngày kết thúc");
        }
        if (page < 0 || size < 1) {
            throw new IllegalArgumentException("Thông tin phân trang không hợp lệ");
        }
        LocalDateTime start = fromDate != null ? fromDate.atStartOfDay() : null;
        LocalDateTime end = toDate != null ? toDate.plusDays(1).atStartOfDay() : null;
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        return repository.findDoctorClsReviewQueue(
                maBacSi, maChuyenKhoa, start, end, trangThaiDv, trangThaiKq, maDichVu, pageable);
    }

    /**
     * Tạo phiếu chỉ định kèm danh sách chi tiết dịch vụ.
   
     * Trước khi tạo mới sẽ xoá các phiếu chỉ định cũ của cùng phiếu khám nếu
     * chưa dịch vụ nào được thực hiện, đồng thời giữ chỗ phòng theo hạn mức
     * phòng/ngày và bổ sung đơn giá từ danh mục dịch vụ khi thiếu.
    
     *
     * @param request yêu cầu gồm phiếu chỉ định và danh sách chi tiết
     * @return phiếu chỉ định đã lưu, hoặc {@code null} nếu không có chi tiết nào
     * @throws Exception khi chưa chọn phòng cho dịch vụ CLS
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public PhieuChiDinh create(ReferralRequest request) throws Exception {
        if (request == null || request.getPhieuChiDinh() == null) {
            throw new IllegalArgumentException("Thiếu thông tin phiếu chỉ định");
        }

        PhieuChiDinh pk = request.getPhieuChiDinh();
        List<ChiTietChiDinh> details = request.getChiTietList();
        if (pk.getMaPhieuKham() == null) {
            throw new IllegalArgumentException("Thiếu phiếu khám nguồn");
        }
        if (pk.getMaPhieuChiDinh() != null) {
            throw new IllegalArgumentException("Phiếu chỉ định tạo mới không được gửi mã phiếu");
        }
        if (details == null || details.isEmpty()) {
            return null;
        }

        Integer maPhieuKham = pk.getMaPhieuKham();
        PhieuKham phieuKham = phieuKhamRepository.findById(maPhieuKham)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phiếu khám nguồn"));
        if (phieuKham.getMaDichVu() == null) {
            throw new IllegalArgumentException("Không xác định được dịch vụ khám nguồn");
        }

        List<DangKyKhamBenh> registrations = dangKyKhamBenhRepository.findAllByMaPhieuKham(maPhieuKham);
        if (registrations.size() != 1) {
            throw new IllegalArgumentException("Không xác định được duy nhất đăng ký khám nguồn");
        }
        DangKyKhamBenh registration = registrations.get(0);
        DichVu visitService = dichVuRepository.findById(phieuKham.getMaDichVu())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy dịch vụ khám nguồn"));
        if (!"KHAM_BENH".equals(visitService.getLoaiDichVu())
                || registration.getMaDichVu() == null
                || !phieuKham.getMaDichVu().equals(registration.getMaDichVu())
                || phieuKham.getMaChuyenKhoa() == null
                || !phieuKham.getMaChuyenKhoa().equals(registration.getMaChuyenKhoa())
                || visitService.getMaChuyenKhoa() == null
                || !phieuKham.getMaChuyenKhoa().equals(visitService.getMaChuyenKhoa())) {
            throw new IllegalArgumentException("Phiếu khám nguồn không thuộc luồng khám chuyên khoa");
        }

        List<PhieuChiDinh> existingPcds = repository.findByMaPhieuKham(maPhieuKham);
        Map<Integer, PhieuChiDinh> existingPcdById = new HashMap<>();
        Set<Integer> replaceablePcdIds = new HashSet<>();
        Set<Integer> targetedPcdIds = new HashSet<>();
        Map<Integer, ChiTietChiDinh> existingDetailsByRequestId = new HashMap<>();
        List<ChiTietChiDinh> existingDetails = new ArrayList<>();
        for (PhieuChiDinh oldPcd : existingPcds) {
            List<ChiTietChiDinh> oldDetails = chiTietRepository.findByMaPhieuChiDinh(oldPcd.getMaPhieuChiDinh());
            existingDetails.addAll(oldDetails);
            boolean allNotPerformed = true;
            for (ChiTietChiDinh oldDetail : oldDetails) {
                if ("DA_THUC_HIEN".equals(oldDetail.getTrangThaiDv())) {
                    allNotPerformed = false;
                    break;
                }
            }
            existingPcdById.put(oldPcd.getMaPhieuChiDinh(), oldPcd);
            if (allNotPerformed) {
                replaceablePcdIds.add(oldPcd.getMaPhieuChiDinh());
            }
        }

        // Bắt buộc chọn phòng cho mọi dịch vụ CLS, giữ chỗ theo hạn mức phòng/ngày
        LocalDate today = TimeUtil.today();
        Set<Integer> requestedServiceCodes = new HashSet<>();
        for (ChiTietChiDinh item : details) {
            if (item == null || item.getMaDichVu() == null) {
                throw new IllegalArgumentException("Thiếu dịch vụ trong chi tiết chỉ định");
            }
            if (item.getMaPhong() == null) {
                throw new IllegalArgumentException("Vui lòng chọn phòng cho tất cả dịch vụ");
            }
            DichVu requestedService = dichVuRepository.findById(item.getMaDichVu())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy dịch vụ chỉ định"));
            if (!isClsService(requestedService)) {
                throw new IllegalArgumentException("Phiếu chỉ định chỉ hỗ trợ dịch vụ CLS");
            }
            if (!requestedServiceCodes.add(item.getMaDichVu())) {
                throw new IllegalArgumentException(
                        "Mã dịch vụ " + item.getMaDichVu() + " bị lặp trong yêu cầu chỉ định");
            }

            if (item.getId() != null) {
                if (existingDetailsByRequestId.containsKey(item.getId())) {
                    throw new IllegalArgumentException("Chi tiết chỉ định bị lặp trong yêu cầu");
                }
                ChiTietChiDinh storedDetail = chiTietRepository.findById(item.getId())
                        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chi tiết chỉ định"));
                PhieuChiDinh owner = existingPcdById.get(storedDetail.getMaPhieuChiDinh());
                if (owner == null || !maPhieuKham.equals(owner.getMaPhieuKham())) {
                    throw new IllegalArgumentException("Chi tiết chỉ định không thuộc phiếu khám đang cập nhật");
                }
                if (!replaceablePcdIds.contains(owner.getMaPhieuChiDinh())) {
                    throw new IllegalArgumentException("Không thể thay thế chi tiết đã có dịch vụ thực hiện");
                }
                if (storedDetail.getMaDichVu() == null
                        || !storedDetail.getMaDichVu().equals(item.getMaDichVu())) {
                    throw new IllegalArgumentException("Dịch vụ không khớp với chi tiết chỉ định cần thay thế");
                }
                if ("DANG_KY_TRUC_TIEP".equals(storedDetail.getNguonTao())) {
                    throw new IllegalArgumentException("Không thể trộn chi tiết đăng ký CLS trực tiếp vào phiếu chỉ định");
                }
                existingDetailsByRequestId.put(item.getId(), storedDetail);
                targetedPcdIds.add(owner.getMaPhieuChiDinh());
            }
        }

        Set<Integer> existingServiceCodes = new HashSet<>();
        for (ChiTietChiDinh existingDetail : existingDetails) {
            if (existingDetail.getMaDichVu() != null
                    && !existingDetailsByRequestId.containsKey(existingDetail.getId())) {
                existingServiceCodes.add(existingDetail.getMaDichVu());
            }
        }
        for (ChiTietChiDinh item : details) {
            if (existingServiceCodes.contains(item.getMaDichVu())) {
                throw new IllegalArgumentException(
                        "Dịch vụ mã " + item.getMaDichVu()
                                + " đã tồn tại trong các phiếu chỉ định của phiếu khám này");
            }
        }

        // Chỉ thay thế các detail được request chỉ rõ; giữ nguyên các detail còn lại của PCD.
        if (!existingDetailsByRequestId.isEmpty()) {
            chiTietRepository.deleteAll(existingDetailsByRequestId.values());
            for (PhieuChiDinh oldPcd : existingPcds) {
                if (targetedPcdIds.contains(oldPcd.getMaPhieuChiDinh())
                        && chiTietRepository.findByMaPhieuChiDinh(oldPcd.getMaPhieuChiDinh()).isEmpty()) {
                    repository.delete(oldPcd);
                }
            }
        }

        for (ChiTietChiDinh item : details) {
            hanMucPhongService.giuChoPhong(item.getMaPhong(), today);
        }

        if (pk.getNgayChiDinh() == null) pk.setNgayChiDinh(LocalDateTime.now());
        PhieuChiDinh savedPk = repository.save(pk);

        List<ChiTietChiDinh> detailsToSave = new ArrayList<>();
        for (ChiTietChiDinh item : details) {
            ChiTietChiDinh detailToSave = item;
            ChiTietChiDinh storedDetail = item.getId() == null ? null : existingDetailsByRequestId.get(item.getId());
            if (storedDetail == null) {
                item.setMaBacSi(null);
                item.setNguonTao("BAC_SI_CHI_DINH");
                if (item.getTrangThaiDv() == null) item.setTrangThaiDv("CHUA_THUC_HIEN");
            } else {
                detailToSave = new ChiTietChiDinh();
                detailToSave.setMaBacSi(storedDetail.getMaBacSi());
                detailToSave.setNguonTao(storedDetail.getNguonTao());
                detailToSave.setMaDichVu(item.getMaDichVu());
                detailToSave.setSoLuong(item.getSoLuong() != null ? item.getSoLuong() : storedDetail.getSoLuong());
                detailToSave.setDonGia(item.getDonGia() != null ? item.getDonGia() : storedDetail.getDonGia());
                detailToSave.setTrangThaiDv(storedDetail.getTrangThaiDv() == null
                        ? "CHUA_THUC_HIEN" : storedDetail.getTrangThaiDv());
                detailToSave.setMaNhanVienThucHien(storedDetail.getMaNhanVienThucHien());
                detailToSave.setMaPhong(item.getMaPhong());
            }
            detailToSave.setMaPhieuChiDinh(savedPk.getMaPhieuChiDinh());

            // Đảm bảo donGia được lấy từ catalog nếu frontend gửi null hoặc 0
            if (detailToSave.getDonGia() == null || detailToSave.getDonGia() <= 0) {
                DichVu service = dichVuRepository.findById(detailToSave.getMaDichVu()).orElse(null);
                if (service != null && service.getDonGia() != null) {
                    detailToSave.setDonGia(service.getDonGia().doubleValue());
                }
            }

            detailsToSave.add(detailToSave);
        }
        chiTietRepository.saveAll(detailsToSave);
        return savedPk;
    }

    /**
     * Lấy các phiếu chỉ định thuộc một phiếu khám.
     *
     * @param maPhieuKham mã phiếu khám
     * @return danh sách phiếu chỉ định tương ứng
     */
    @Override
    public List<PhieuChiDinh> getByPhieuKham(Integer maPhieuKham) {
        return repository.findByMaPhieuKham(maPhieuKham);
    }

    /**
     * Lấy các phiếu chỉ định của một bệnh nhân.
     *
     * @param maBenhNhan mã bệnh nhân
     * @return danh sách phiếu chỉ định tương ứng
     */
    @Override
    public List<PhieuChiDinh> getByBenhNhan(Integer maBenhNhan) {
        return repository.findByMaBenhNhan(maBenhNhan);
    }

    /**
     * Lấy danh sách chi tiết dịch vụ của một phiếu chỉ định.
     *
     * @param id mã phiếu chỉ định
     * @return danh sách chi tiết chỉ định
     */
    @Override
    public List<ChiTietChiDinh> getDetails(Integer id) {
        return chiTietRepository.findByMaPhieuChiDinh(id);
    }

    /**
     * Lấy kết quả chẩn đoán hình ảnh của một chi tiết chỉ định.
     *
     * @param detailId mã chi tiết chỉ định
     * @return kết quả CĐHA kèm đường dẫn ảnh, hoặc {@code null} nếu chưa có kết quả
     */
    @Override
    public Object getCdhaResult(Integer detailId) {
        KetQuaCdha kq = ketQuaCdhaRepository
                .findFirstByIdChiTietChiDinhOrderByNgayThucHienDescIdDesc(detailId).orElse(null);
        if (kq != null) {
            requireDoctorReadAccess(detailId, "CLS_CHAN_DOAN_HINH_ANH",
                    kq.getTrangThai(), kq.getMaBacSiThucHien());
            fillAnhCdha(kq);
        }
        return kq;
    }

    /**
     * Lấy kết quả xét nghiệm của một chi tiết chỉ định kèm tên nhân viên thực hiện
     * và danh sách chi tiết từng chỉ số.
     *
     * @param detailId mã chi tiết chỉ định
     * @return đối tượng kết quả dạng bản đồ, hoặc {@code null} nếu chưa có kết quả
     */
    @Override
    public Object getXetNhiemResult(Integer detailId) {
        var kqOpt = ketQuaXetNghiemRepository
                .findFirstByMaChiTietChiDinhOrderByNgayThucHienDescIdDesc(detailId);
        if (kqOpt.isPresent()) {
            KetQuaXetNghiem kq = kqOpt.get();
            requireDoctorReadAccess(detailId, "CLS_XET_NGHIEM",
                    kq.getTrangThai(), kq.getMaBsKetLuan());
            Map<String, Object> response = new HashMap<>();
            response.put("id", kq.getId());
            response.put("maChiTietChiDinh", kq.getMaChiTietChiDinh());
            response.put("ngayThucHien", kq.getNgayThucHien());
            response.put("nguoiThucHien", kq.getNguoiThucHien());
            // Lấy tên nhân viên thực hiện từ bảng nhan_vien
            if (kq.getNguoiThucHien() != null) {
                nhanVienRepository.findById(kq.getNguoiThucHien()).ifPresent(nv -> 
                    response.put("tenNguoiThucHien", nv.getHoTen())
                );
            }
            response.put("maBsKetLuan", kq.getMaBsKetLuan());
            response.put("ketLuan", kq.getKetLuan());
            response.put("ketQua", kq.getKetQua());
            response.put("ghiChuThem", kq.getGhiChuThem());
            response.put("trangThai", kq.getTrangThai());
            response.put("chiTietKetQua", getChiTiet(kq.getId()));
            return response;
        }
        return null;
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Map<String, Object> claimDoctorResult(Integer detailId) {
        NhanVien doctor = clsResultAuthorizationService.requireClsDoctor();
        ChiTietChiDinh detail = clsResultAuthorizationService.findClsDetail(detailId, null);
        DichVu service = dichVuRepository.findById(detail.getMaDichVu())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.CONFLICT, "Không tìm thấy dịch vụ của chi tiết chỉ định"));
        String serviceType = service.getLoaiDichVu();
        clsResultAuthorizationService.requireAuthorizedClsDetail(detailId, doctor, serviceType);

        if ("CLS_XET_NGHIEM".equals(serviceType)) {
            KetQuaXetNghiem result = ketQuaXetNghiemRepository
                    .findFirstByMaChiTietChiDinhOrderByNgayThucHienDescIdDesc(detailId).orElse(null);
            return claimXetNghiemResult(detailId, doctor, result);
        }
        if ("CLS_CHAN_DOAN_HINH_ANH".equals(serviceType)) {
            KetQuaCdha result = ketQuaCdhaRepository
                    .findFirstByIdChiTietChiDinhOrderByNgayThucHienDescIdDesc(detailId).orElse(null);
            return claimCdhaResult(detailId, doctor, result);
        }
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Chi tiết không thuộc dịch vụ CLS hợp lệ");
    }

    private Map<String, Object> claimXetNghiemResult(
            Integer detailId, NhanVien doctor, KetQuaXetNghiem result) {
        if (result == null || !"CHO_DUYET".equals(result.getTrangThai())) {
            return staleClaimResponse(result == null ? null : result.getTrangThai());
        }
        if (doctor.getMaNhanVien().equals(result.getMaBsKetLuan())) {
            return successfulClaimResponse();
        }
        if (result.getMaBsKetLuan() != null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Kết quả đang được bác sĩ khác xử lý.");
        }
        if (ketQuaXetNghiemRepository.claimPendingResult(result.getId(), doctor.getMaNhanVien()) > 0) {
            return successfulClaimResponse();
        }
        entityManager.clear();
        KetQuaXetNghiem latest = ketQuaXetNghiemRepository
                .findFirstByMaChiTietChiDinhOrderByNgayThucHienDescIdDesc(detailId).orElse(null);
        if (latest != null && "CHO_DUYET".equals(latest.getTrangThai())
                && doctor.getMaNhanVien().equals(latest.getMaBsKetLuan())) {
            return successfulClaimResponse();
        }
        if (latest != null && "CHO_DUYET".equals(latest.getTrangThai())
                && latest.getMaBsKetLuan() != null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Kết quả đang được bác sĩ khác xử lý.");
        }
        return staleClaimResponse(latest == null ? null : latest.getTrangThai());
    }

    private Map<String, Object> claimCdhaResult(
            Integer detailId, NhanVien doctor, KetQuaCdha result) {
        if (result == null || !"CHO_DUYET".equals(result.getTrangThai())) {
            return staleClaimResponse(result == null ? null : result.getTrangThai());
        }
        if (doctor.getMaNhanVien().equals(result.getMaBacSiThucHien())) {
            return successfulClaimResponse();
        }
        if (result.getMaBacSiThucHien() != null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Kết quả đang được bác sĩ khác xử lý.");
        }
        if (ketQuaCdhaRepository.claimPendingResult(result.getId(), doctor.getMaNhanVien()) > 0) {
            return successfulClaimResponse();
        }
        entityManager.clear();
        KetQuaCdha latest = ketQuaCdhaRepository
                .findFirstByIdChiTietChiDinhOrderByNgayThucHienDescIdDesc(detailId).orElse(null);
        if (latest != null && "CHO_DUYET".equals(latest.getTrangThai())
                && doctor.getMaNhanVien().equals(latest.getMaBacSiThucHien())) {
            return successfulClaimResponse();
        }
        if (latest != null && "CHO_DUYET".equals(latest.getTrangThai())
                && latest.getMaBacSiThucHien() != null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Kết quả đang được bác sĩ khác xử lý.");
        }
        return staleClaimResponse(latest == null ? null : latest.getTrangThai());
    }

    private Map<String, Object> successfulClaimResponse() {
        return Map.of("claimed", true);
    }

    private Map<String, Object> staleClaimResponse(String trangThai) {
        Map<String, Object> response = new HashMap<>();
        response.put("claimed", false);
        response.put("trangThaiKq", trangThai);
        response.put("message", "Kết quả không còn ở trạng thái chờ duyệt. Vui lòng tải lại danh sách.");
        return response;
    }

    private void requireDoctorReadAccess(
            Integer detailId, String serviceType, String trangThai, Integer maBacSiXuLy) {
        NhanVien doctor = clsResultAuthorizationService.getClsDoctorIfAuthenticated();
        if (doctor != null && "CHO_DUYET".equals(trangThai)) {
            clsResultAuthorizationService.requireAuthorizedClsDetail(detailId, doctor, serviceType);
            clsResultAuthorizationService.requireDoctorOwnsPendingResult(
                    doctor.getMaNhanVien(), trangThai, maBacSiXuLy);
        }
    }

    private boolean isPendingResultVisibleToDoctor(
            Integer detailId, String serviceType, String trangThai, Integer maBacSiXuLy) {
        NhanVien doctor = clsResultAuthorizationService.getClsDoctorIfAuthenticated();
        if (doctor == null || !"CHO_DUYET".equals(trangThai)) return true;
        if (maBacSiXuLy == null || !doctor.getMaNhanVien().equals(maBacSiXuLy)) return false;
        clsResultAuthorizationService.requireAuthorizedClsDetail(detailId, doctor, serviceType);
        return true;
    }

    /**
     * Lấy toàn bộ kết quả xét nghiệm thuộc một phiếu khám.
     *
     * @param maPhieuKham mã phiếu khám
     * @return danh sách kết quả xét nghiệm (kèm tên dịch vụ và tên người thực hiện)
     */
    @Override
    public List<Map<String, Object>> getXetNhiemResultsByPhieuKham(Integer maPhieuKham) {
        List<PhieuChiDinh> pcdList = repository.findByMaPhieuKham(maPhieuKham);
        List<Map<String, Object>> responseList = new java.util.ArrayList<>();

        for (PhieuChiDinh pcd : pcdList) {
            List<ChiTietChiDinh> details = chiTietRepository.findByMaPhieuChiDinh(pcd.getMaPhieuChiDinh());
            for (ChiTietChiDinh detail : details) {
                var kqOpt = ketQuaXetNghiemRepository
                        .findFirstByMaChiTietChiDinhOrderByNgayThucHienDescIdDesc(detail.getId());
                if (kqOpt.isPresent()) {
                    var kq = kqOpt.get();
                    if (!isPendingResultVisibleToDoctor(
                            detail.getId(), "CLS_XET_NGHIEM", kq.getTrangThai(), kq.getMaBsKetLuan())) {
                        continue;
                    }

                    String tenDichVu = dichVuRepository.findById(detail.getMaDichVu())
                            .map(DichVu::getTenDichVu).orElse("Dịch vụ xét nghiệm");

                    Map<String, Object> response = new HashMap<>();
                    response.put("id", kq.getId());
                    response.put("maChiTietChiDinh", kq.getMaChiTietChiDinh());
                    response.put("tenDichVu", tenDichVu);
                    response.put("ngayThucHien", kq.getNgayThucHien());
                    response.put("nguoiThucHien", kq.getNguoiThucHien());
                    // Lấy tên nhân viên thực hiện từ bảng nhan_vien
                    if (kq.getNguoiThucHien() != null) {
                        nhanVienRepository.findById(kq.getNguoiThucHien()).ifPresent(nv -> 
                            response.put("tenNguoiThucHien", nv.getHoTen())
                        );
                    }
                    response.put("maBsKetLuan", kq.getMaBsKetLuan());
                    response.put("ketLuan", kq.getKetLuan());
                    response.put("ketQua", kq.getKetQua());
                    response.put("ghiChuThem", kq.getGhiChuThem());
                    response.put("trangThai", kq.getTrangThai());
                    response.put("chiTietKetQua", getChiTiet(kq.getId()));
                    responseList.add(response);
                }
            }
        }
        return responseList;
    }

    /**
     * Lấy chi tiết các chỉ số của một kết quả xét nghiệm, bổ sung tên chỉ số,
     * đơn vị và giá trị bình thường từ danh mục chỉ số.
     *
     * @param maKetQuaXn mã kết quả xét nghiệm
     * @return danh sách chi tiết chỉ số dạng bản đồ
     */
    private List<Map<String, Object>> getChiTiet(Integer maKetQuaXn) {
        List<Map<String, Object>> result = new java.util.ArrayList<>();
        for (ChiTietKetQuaXn ct : chiTietKetQuaXnRepository.findByMaKetQuaXn(maKetQuaXn)) {
            Map<String, Object> m = new HashMap<>();
            m.put("maChiSo", ct.getMaChiSo());
            m.put("giaTri", ct.getGiaTri());
            m.put("ghiChu", ct.getGhiChu());
            chiTietXetNghiemRepository.findById(ct.getMaChiSo()).ifPresent(cs -> {
                m.put("tenChiSo", cs.getTenChiSo());
                m.put("donVi", cs.getDonVi());
                m.put("giaTriBinhThuong", cs.getGiaTriBinhThuong());
            });
            result.add(m);
        }
        return result;
    }

    /**
     * Kiểm tra xem dịch vụ trong chi tiết chỉ định có phải là CLS hay không
     * dựa vào cột loai_dich_vu trong bảng dich_vu.
     * Các loại CLS: 'CLS_XET_NGHIEM', 'CLS_CHAN_DOAN_HINH_ANH'
     */
    private boolean isClsService(DichVu dichVu) {
        if (dichVu == null || dichVu.getLoaiDichVu() == null) return false;
        String loai = dichVu.getLoaiDichVu();
        return "CLS_XET_NGHIEM".equals(loai) || "CLS_CHAN_DOAN_HINH_ANH".equals(loai);
    }

    /**
     * Hoàn tất phiếu khám CLS chỉ khi mọi detail CLS đều đã thực hiện và kết quả đã duyệt.
     */
    private void completeIfClsService(PhieuKham phieuKham) {
        if (phieuKham == null || phieuKham.getMaDichVu() == null) return;

        DichVu dichVu = dichVuRepository.findById(phieuKham.getMaDichVu()).orElse(null);
        if (!isClsService(dichVu)) return;

        boolean hasClsDetail = false;
        for (PhieuChiDinh order : repository.findByMaPhieuKham(phieuKham.getMaPhieuKham())) {
            for (ChiTietChiDinh detail : chiTietRepository.findByMaPhieuChiDinh(order.getMaPhieuChiDinh())) {
                DichVu detailService = detail.getMaDichVu() == null
                        ? null : dichVuRepository.findById(detail.getMaDichVu()).orElse(null);
                if (!isClsService(detailService)) continue;

                hasClsDetail = true;
                if (!"DA_THUC_HIEN".equals(detail.getTrangThaiDv())) return;

                boolean approved;
                if ("CLS_XET_NGHIEM".equals(detailService.getLoaiDichVu())) {
                    approved = ketQuaXetNghiemRepository
                            .findFirstByMaChiTietChiDinhOrderByNgayThucHienDescIdDesc(detail.getId())
                            .map(result -> "DA_DUYET".equals(result.getTrangThai()))
                            .orElse(false);
                } else {
                    approved = ketQuaCdhaRepository
                            .findFirstByIdChiTietChiDinhOrderByNgayThucHienDescIdDesc(detail.getId())
                            .map(result -> "DA_DUYET".equals(result.getTrangThai()))
                            .orElse(false);
                }
                if (!approved) return;
            }
        }
        if (!hasClsDetail) return;

        phieuKham.setTrangThai("HOAN_THANH");
        phieuKhamRepository.save(phieuKham);

        if (webSocketPublisher != null) {
            webSocketPublisher.publishPhieuKhamChange("UPDATED", phieuKham);
        }

        dangKyKhamBenhRepository.findByMaPhieuKham(phieuKham.getMaPhieuKham()).ifPresent(dk -> {
            dk.setTrangThai("HOAN_THANH");
            dangKyKhamBenhRepository.save(dk);
            if (webSocketPublisher != null) {
                webSocketPublisher.publishDangKyKhamChange("UPDATED", dk.getId(), dk.getTrangThai());
            }
        });

        dangKyKhamBenhRepository.findByMaPhieuKham(phieuKham.getMaPhieuKham()).ifPresent(dk -> {
            lichKhamRepository.findByMaDangKyKhamBenh(dk.getId()).ifPresent(lk -> {
                lk.setTrangThai("HOAN_THANH");
                lichKhamRepository.save(lk);
            });
        });
    }

    /**
     * Duyệt kết quả xét nghiệm: cập nhật kết luận/bác sĩ kết luận, đặt trạng thái
     * {@code DA_DUYET} và hoàn tất phiếu khám nếu dịch vụ thuộc loại CLS.

     * Khi {@code updateOnly=true} chỉ cập nhật nội dung, giữ nguyên trạng thái
     * và không phát tín hiệu duyệt.
  
     *
     * @param id mã kết quả xét nghiệm
     * @param body dữ liệu duyệt gồm {@code ketLuan}, {@code ghiChuThem}, {@code ketQua}
     *             và cờ {@code updateOnly} tuỳ chọn; danh tính bác sĩ lấy từ phiên đăng nhập
     * @throws Exception nếu không tìm thấy kết quả
     */
    @Override
    @Transactional
    public void approveTestResult(Integer id, Map<String, Object> body) throws Exception {
        NhanVien doctor = clsResultAuthorizationService.requireClsDoctor();
        if (body == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu dữ liệu duyệt kết quả");
        }
        KetQuaXetNghiem kq = ketQuaXetNghiemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy kết quả"));
        Integer detailId = kq.getMaChiTietChiDinh();
        Integer latestResultId = ketQuaXetNghiemRepository
                .findFirstByMaChiTietChiDinhOrderByNgayThucHienDescIdDesc(detailId)
                .map(KetQuaXetNghiem::getId)
                .orElse(null);
        if (!id.equals(latestResultId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Kết quả không còn là bản ghi hiện hành của chi tiết chỉ định.");
        }
        ChiTietChiDinh detail = clsResultAuthorizationService.requireAuthorizedClsDetail(
                detailId, doctor, "CLS_XET_NGHIEM");
        boolean updateOnly = body.get("updateOnly") != null
                && Boolean.parseBoolean(body.get("updateOnly").toString());
        String allowedStatus = updateOnly ? "DA_DUYET" : "CHO_DUYET";
        if (!allowedStatus.equals(kq.getTrangThai())
                || !"DA_THUC_HIEN".equals(detail.getTrangThaiDv())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Kết quả không ở trạng thái cho phép cập nhật.");
        }
        clsResultAuthorizationService.requireDoctorOwnsPendingResult(
                doctor.getMaNhanVien(), kq.getTrangThai(), kq.getMaBsKetLuan());

        if (body.get("ketLuan") != null) kq.setKetLuan(body.get("ketLuan").toString());
        kq.setMaBsKetLuan(doctor.getMaNhanVien());
        if (body.get("ghiChuThem") != null) kq.setGhiChuThem(body.get("ghiChuThem").toString());
        if (body.get("ketQua") != null) kq.setKetQua(body.get("ketQua").toString());

        // Nếu chỉ cập nhật nội dung (xem lại đã duyệt) thì giữ nguyên trạng thái
        if (!updateOnly) {
            kq.setTrangThai("DA_DUYET");
        }
        ketQuaXetNghiemRepository.save(kq);

        if (updateOnly) return;

        PhieuChiDinh order = repository.findById(detail.getMaPhieuChiDinh()).orElse(null);
        if (order != null && webSocketPublisher != null) {
            webSocketPublisher.publishClsChange("APPROVED", order.getMaPhieuKham(), "XET_NGHIEM");
        }
        if (order != null) {
            phieuKhamRepository.findById(order.getMaPhieuKham()).ifPresent(this::completeIfClsService);
        }
    }

    /**
     * Lấy lịch sử các kết quả xét nghiệm đã duyệt của một bác sĩ.
     *
     * @param maBacSi mã bác sĩ
     * @return danh sách lịch sử kết quả đã duyệt
     */
    @Override
    public List<Map<String, Object>> getApprovedHistory(Integer maBacSi) {
        LocalDate today = TimeUtil.today();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();
        return ketQuaXetNghiemRepository.findApprovedHistoryDetailed(maBacSi, start, end);
    }

    /**
     * Từ chối kết quả xét nghiệm: đặt trạng thái {@code TU_CHOI}, lưu lý do vào ghi chú
     * và trả chi tiết chỉ định về trạng thái {@code CHUA_THUC_HIEN}.
     *
     * @param id mã kết quả xét nghiệm
     * @param body dữ liệu từ chối, bắt buộc có {@code reason}
     * @throws Exception nếu thiếu lý do hoặc không tìm thấy kết quả
     */
    @Override
    @Transactional
    public void rejectTestResult(Integer id, Map<String, String> body) throws Exception {
        NhanVien doctor = clsResultAuthorizationService.requireClsDoctor();
        if (body == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu lý do từ chối");
        }
        String reason = body.get("reason");
        if (reason == null || reason.trim().isEmpty()) throw new Exception("Vui lòng nhập lý do từ chối");

        KetQuaXetNghiem kq = ketQuaXetNghiemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy kết quả"));
        Integer detailId = kq.getMaChiTietChiDinh();
        Integer latestResultId = ketQuaXetNghiemRepository
                .findFirstByMaChiTietChiDinhOrderByNgayThucHienDescIdDesc(detailId)
                .map(KetQuaXetNghiem::getId)
                .orElse(null);
        if (!id.equals(latestResultId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Kết quả không còn là bản ghi hiện hành của chi tiết chỉ định.");
        }
        ChiTietChiDinh detail = clsResultAuthorizationService.requireAuthorizedClsDetail(
                detailId, doctor, "CLS_XET_NGHIEM");
        if (!"CHO_DUYET".equals(kq.getTrangThai())
                || !"DA_THUC_HIEN".equals(detail.getTrangThaiDv())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Kết quả không ở trạng thái chờ duyệt.");
        }
        clsResultAuthorizationService.requireDoctorOwnsPendingResult(
                doctor.getMaNhanVien(), kq.getTrangThai(), kq.getMaBsKetLuan());

        kq.setTrangThai("TU_CHOI");
        kq.setGhiChuThem(reason);
        ketQuaXetNghiemRepository.save(kq);

        detail.setTrangThaiDv("CHUA_THUC_HIEN");
        chiTietRepository.save(detail);
        PhieuChiDinh order = repository.findById(detail.getMaPhieuChiDinh()).orElse(null);
        if (order != null && webSocketPublisher != null) {
            webSocketPublisher.publishClsChange("REJECTED", order.getMaPhieuKham(), "XET_NGHIEM");
        }
    }

    /**
     * Lấy toàn bộ kết quả chẩn đoán hình ảnh thuộc một phiếu khám.
     *
     * @param maPhieuKham mã phiếu khám
     * @return danh sách kết quả CĐHA kèm danh sách đường dẫn ảnh
     */
    @Override
    public List<Map<String, Object>> getCdhaResultsByPhieuKham(Integer maPhieuKham) {
        List<PhieuChiDinh> pcdList = repository.findByMaPhieuKham(maPhieuKham);
        List<Map<String, Object>> responseList = new java.util.ArrayList<>();

        for (PhieuChiDinh pcd : pcdList) {
            List<ChiTietChiDinh> details = chiTietRepository.findByMaPhieuChiDinh(pcd.getMaPhieuChiDinh());
            for (ChiTietChiDinh detail : details) {
                var kqOpt = ketQuaCdhaRepository
                        .findFirstByIdChiTietChiDinhOrderByNgayThucHienDescIdDesc(detail.getId());
                if (kqOpt.isPresent()) {
                    var kq = kqOpt.get();
                    if (!isPendingResultVisibleToDoctor(
                            detail.getId(), "CLS_CHAN_DOAN_HINH_ANH",
                            kq.getTrangThai(), kq.getMaBacSiThucHien())) {
                        continue;
                    }
                    String tenDichVu = dichVuRepository.findById(detail.getMaDichVu())
                            .map(DichVu::getTenDichVu).orElse("Dịch vụ chẩn đoán hình ảnh");

                    Map<String, Object> response = new HashMap<>();
                    response.put("id", kq.getId());
                    response.put("maChiTietChiDinh", detail.getId());
                    response.put("tenDichVu", tenDichVu);
                    response.put("ngayThucHien", kq.getNgayThucHien());
                    response.put("maNhanVienThucHien", kq.getMaNhanVienThucHien());
                    response.put("maBacSiThucHien", kq.getMaBacSiThucHien());
                    response.put("moTaHinhAnh", kq.getMoTaHinhAnh());
                    response.put("ketLuan", kq.getKetLuan());
                    response.put("deNghi", kq.getDeNghi());
                    // Điền ảnh từ bảng mới (tương thích ngược duongDanAnh1/2)
                    java.util.List<String> urls = getUrlsAnhCdha(kq.getId());
                    response.put("duongDanAnh1", urls.size() > 0 ? urls.get(0) : null);
                    response.put("duongDanAnh2", urls.size() > 1 ? urls.get(1) : null);
                    response.put("danhSachAnh", urls);
                    response.put("trangThaiDv", detail.getTrangThaiDv());
                    responseList.add(response);
                }
            }
        }
        return responseList;
    }

    /**
     * Duyệt kết quả chẩn đoán hình ảnh: cập nhật mô tả/kết luận/đề nghị, đặt trạng thái
     * {@code DA_DUYET}, đồng bộ gallery ảnh và hoàn tất phiếu khám nếu dịch vụ thuộc loại CLS.

     * Khi {@code updateOnly=true} chỉ cập nhật nội dung, giữ nguyên trạng thái
     * và không thay đổi gallery ảnh.

     *
     * @param detailId mã chi tiết chỉ định
     * @param body dữ liệu duyệt gồm mô tả, kết luận, đề nghị, ảnh và cờ
     *             {@code updateOnly} tuỳ chọn; mã bác sĩ lấy từ phiên đăng nhập
     * @throws Exception nếu xảy ra lỗi nghiệp vụ khi duyệt
     */
    @Override
    @Transactional
    public void approveCdhaResult(Integer detailId, Map<String, Object> body) throws Exception {
        NhanVien doctor = clsResultAuthorizationService.requireClsDoctor();
        if (body == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu dữ liệu duyệt kết quả");
        }
        ChiTietChiDinh detail = clsResultAuthorizationService.requireAuthorizedClsDetail(
                detailId, doctor, "CLS_CHAN_DOAN_HINH_ANH");
        KetQuaCdha kq = ketQuaCdhaRepository
                .findFirstByIdChiTietChiDinhOrderByNgayThucHienDescIdDesc(detailId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy kết quả CĐHA"));
        boolean updateOnly = body.get("updateOnly") != null
                && Boolean.parseBoolean(body.get("updateOnly").toString());
        String allowedStatus = updateOnly ? "DA_DUYET" : "CHO_DUYET";
        if (!allowedStatus.equals(kq.getTrangThai())
                || !"DA_THUC_HIEN".equals(detail.getTrangThaiDv())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Kết quả không ở trạng thái cho phép cập nhật.");
        }
        clsResultAuthorizationService.requireDoctorOwnsPendingResult(
                doctor.getMaNhanVien(), kq.getTrangThai(), kq.getMaBacSiThucHien());

        kq.setIdChiTietChiDinh(detailId);
        kq.setNgayThucHien(LocalDateTime.now());
        kq.setMaBacSiThucHien(doctor.getMaNhanVien());
        if (body.get("moTaHinhAnh") != null) kq.setMoTaHinhAnh(body.get("moTaHinhAnh").toString());
        if (body.get("ketLuan") != null) kq.setKetLuan(body.get("ketLuan").toString());
        if (body.get("deNghi") != null) kq.setDeNghi(body.get("deNghi").toString());
        String anh1 = body.get("duongDanAnh1") != null ? body.get("duongDanAnh1").toString() : null;
        String anh2 = body.get("duongDanAnh2") != null ? body.get("duongDanAnh2").toString() : null;
        // Tương thích ngược: giữ trường tạm để response cũ vẫn có duongDanAnh1/2
        kq.setDuongDanAnh1(anh1);
        kq.setDuongDanAnh2(anh2);

        // Nếu chỉ cập nhật nội dung (xem lại đã duyệt) thì giữ nguyên trạng thái
        if (!updateOnly) {
            kq.setTrangThai("DA_DUYET");
        }
        KetQuaCdha saved = ketQuaCdhaRepository.save(kq);
        // updateOnly=true → KHÔNG xoá/insert ảnh (giữ nguyên gallery cũ)
        if (!updateOnly) {
            syncHinhAnhCdha(saved.getId(), body, anh1, anh2);
        }

        if (updateOnly) return;

        PhieuChiDinh order = repository.findById(detail.getMaPhieuChiDinh()).orElse(null);
        if (order != null && webSocketPublisher != null) {
            webSocketPublisher.publishClsChange("APPROVED", order.getMaPhieuKham(), "CDHA");
        }
        if (order != null) {
            phieuKhamRepository.findById(order.getMaPhieuKham()).ifPresent(this::completeIfClsService);
        }
    }

    /**
     * Từ chối kết quả chẩn đoán hình ảnh: ghi đề nghị yêu cầu làm lại kèm lý do,
     * đặt trạng thái {@code TU_CHOI} và trả chi tiết chỉ định về {@code CHUA_THUC_HIEN}.
     *
     * @param detailId mã chi tiết chỉ định
     * @param body dữ liệu từ chối, bắt buộc có {@code reason}
     * @throws Exception nếu thiếu lý do từ chối
     */
    @Override
    @Transactional
    public void rejectCdhaResult(Integer detailId, Map<String, String> body) throws Exception {
        NhanVien doctor = clsResultAuthorizationService.requireClsDoctor();
        if (body == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu lý do từ chối");
        }
        String reason = body.get("reason");
        if (reason == null || reason.trim().isEmpty()) throw new Exception("Vui lòng nhập lý do từ chối");

        ChiTietChiDinh detail = clsResultAuthorizationService.requireAuthorizedClsDetail(
                detailId, doctor, "CLS_CHAN_DOAN_HINH_ANH");
        KetQuaCdha kq = ketQuaCdhaRepository
                .findFirstByIdChiTietChiDinhOrderByNgayThucHienDescIdDesc(detailId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy kết quả CĐHA"));
        if (!"CHO_DUYET".equals(kq.getTrangThai())
                || !"DA_THUC_HIEN".equals(detail.getTrangThaiDv())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Kết quả không ở trạng thái chờ duyệt.");
        }
        clsResultAuthorizationService.requireDoctorOwnsPendingResult(
                doctor.getMaNhanVien(), kq.getTrangThai(), kq.getMaBacSiThucHien());

        kq.setDeNghi("YÊU CẦU LÀM LẠI: " + reason);
        kq.setTrangThai("TU_CHOI");
        ketQuaCdhaRepository.save(kq);
        detail.setTrangThaiDv("CHUA_THUC_HIEN");
        chiTietRepository.save(detail);
        PhieuChiDinh order = repository.findById(detail.getMaPhieuChiDinh()).orElse(null);
        if (order != null && webSocketPublisher != null) {
            publishClsChangeAfterCommit("REJECTED", order.getMaPhieuKham(), "CDHA");
        }
    }

    // ===== Helper ảnh CĐHA 1-N (tương thích ngược với 2 field cũ) =====

    /**
     * Đồng bộ gallery vào bảng hinh_anh_ket_qua_cdha.
     * Ưu tiên body.danhSachAnh (client mới, N ảnh). Nếu không có mới fallback anh1/anh2.
     * Chỉ replace khi request thực sự mang ảnh (tránh client cũ gửi payload rỗng làm mất gallery).
     *
     * @param maKetQuaCdha mã kết quả chẩn đoán hình ảnh
     * @param body dữ liệu request chứa danh sách ảnh
     * @param anh1 đường dẫn ảnh thứ nhất (fallback)
     * @param anh2 đường dẫn ảnh thứ hai (fallback)
     */
    private void syncHinhAnhCdha(Integer maKetQuaCdha, Map<String, Object> body, String anh1, String anh2) {
        java.util.List<String> urls = new java.util.ArrayList<>();
        boolean hasImagePayload = false;
        if (body != null) {
            if (body.get("danhSachAnh") instanceof java.util.List) {
                hasImagePayload = true;
                for (Object o : (java.util.List<?>) body.get("danhSachAnh")) {
                    if (o != null && !o.toString().trim().isEmpty()) urls.add(o.toString().trim());
                }
            } else if (body.get("danhSachAnh") instanceof String) {
                String raw = body.get("danhSachAnh").toString().trim();
                if (!raw.isEmpty()) {
                    hasImagePayload = true;
                    for (String s : raw.split("[,\n]")) {
                        if (!s.trim().isEmpty()) urls.add(s.trim());
                    }
                }
            }
            if (body.containsKey("duongDanAnh1") || body.containsKey("duongDanAnh2")) hasImagePayload = true;
        }
        if (urls.isEmpty()) {
            if (anh1 != null && !anh1.trim().isEmpty()) urls.add(anh1.trim());
            if (anh2 != null && !anh2.trim().isEmpty()) urls.add(anh2.trim());
        }
        if (!hasImagePayload) return;
        // Luôn replace gallery theo payload mới nhất (kể cả rỗng → cho phép xóa hết ảnh)
        hinhAnhKetQuaCdhaRepository.deleteByMaKetQuaCdha(maKetQuaCdha);
        java.util.List<com.qlpk.backend.entity.HinhAnhKetQuaCdha> ds = new java.util.ArrayList<>();
        int thuTu = 0;
        for (String u : urls) {
            com.qlpk.backend.entity.HinhAnhKetQuaCdha h = new com.qlpk.backend.entity.HinhAnhKetQuaCdha();
            h.setMaKetQuaCdha(maKetQuaCdha);
            h.setDuongDanAnh(u);
            h.setThuTu(thuTu++);
            h.setNgayTao(java.time.LocalDateTime.now());
            ds.add(h);
        }
        if (!ds.isEmpty()) hinhAnhKetQuaCdhaRepository.saveAll(ds);
    }

    /**
     * Lấy danh sách đường dẫn ảnh của một kết quả CĐHA theo thứ tự hiển thị.
     *
     * @param maKetQuaCdha mã kết quả chẩn đoán hình ảnh
     * @return danh sách đường dẫn ảnh, rỗng nếu không có ảnh hoặc mã không hợp lệ
     */
    private java.util.List<String> getUrlsAnhCdha(Integer maKetQuaCdha) {
        if (maKetQuaCdha == null) return java.util.List.of();
        return hinhAnhKetQuaCdhaRepository.findByMaKetQuaCdhaOrderByThuTuAsc(maKetQuaCdha)
                .stream().map(com.qlpk.backend.entity.HinhAnhKetQuaCdha::getDuongDanAnh)
                .filter(u -> u != null && !u.trim().isEmpty()).toList();
    }

    /** Điền các trường ảnh tạm (duongDanAnh1/2, danhSachAnh) từ bảng ảnh mới để tương thích với client cũ. */
    private void fillAnhCdha(KetQuaCdha kq) {
        java.util.List<String> urls = getUrlsAnhCdha(kq.getId());
        kq.setDuongDanAnh1(urls.size() > 0 ? urls.get(0) : null);
        kq.setDuongDanAnh2(urls.size() > 1 ? urls.get(1) : null);
        kq.setDanhSachAnh(urls);
    }
}