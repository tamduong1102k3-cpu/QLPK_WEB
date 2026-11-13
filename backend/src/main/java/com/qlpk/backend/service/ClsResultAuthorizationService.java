package com.qlpk.backend.service;

import com.qlpk.backend.entity.ChiTietChiDinh;
import com.qlpk.backend.entity.DichVu;
import com.qlpk.backend.entity.NhanVien;
import com.qlpk.backend.entity.PhieuChiDinh;
import com.qlpk.backend.entity.PhieuKham;
import com.qlpk.backend.entity.TaiKhoan;
import com.qlpk.backend.repository.DangKyKhamBenhRepository;
import com.qlpk.backend.repository.ChiTietChiDinhRepository;
import com.qlpk.backend.repository.DichVuRepository;
import com.qlpk.backend.repository.NhanVienRepository;
import com.qlpk.backend.repository.PhieuChiDinhRepository;
import com.qlpk.backend.repository.PhieuKhamRepository;
import com.qlpk.backend.repository.TaiKhoanRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ClsResultAuthorizationService {
    private final TaiKhoanRepository taiKhoanRepository;
    private final NhanVienRepository nhanVienRepository;
    private final ChiTietChiDinhRepository chiTietRepository;
    private final PhieuChiDinhRepository phieuChiDinhRepository;
    private final PhieuKhamRepository phieuKhamRepository;
    private final DichVuRepository dichVuRepository;
    private final DangKyKhamBenhRepository dangKyKhamBenhRepository;

    public ClsResultAuthorizationService(
            TaiKhoanRepository taiKhoanRepository,
            NhanVienRepository nhanVienRepository,
            ChiTietChiDinhRepository chiTietRepository,
            PhieuChiDinhRepository phieuChiDinhRepository,
            PhieuKhamRepository phieuKhamRepository,
            DichVuRepository dichVuRepository,
            DangKyKhamBenhRepository dangKyKhamBenhRepository) {
        this.taiKhoanRepository = taiKhoanRepository;
        this.nhanVienRepository = nhanVienRepository;
        this.chiTietRepository = chiTietRepository;
        this.phieuChiDinhRepository = phieuChiDinhRepository;
        this.phieuKhamRepository = phieuKhamRepository;
        this.dichVuRepository = dichVuRepository;
        this.dangKyKhamBenhRepository = dangKyKhamBenhRepository;
    }

    public NhanVien requireTechnician() {
        TaiKhoan account = requireActiveStaffAccount();
        String role = account.getVaiTro();
        if (role == null || !(role.equals("KY_THUAT_VIEN")
                || role.startsWith("KY_THUAT_VIEN_") || role.startsWith("KTV_"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ kỹ thuật viên CLS được thao tác");
        }
        return findEmployee(account.getMaNhanVien());
    }

    public NhanVien requireClsDoctor() {
        TaiKhoan account = requireActiveStaffAccount();
        String role = account.getVaiTro();
        if (role == null || !(role.equals("BAC_SI") || role.startsWith("BAC_SI_"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ bác sĩ CLS được thao tác");
        }
        NhanVien doctor = findEmployee(account.getMaNhanVien());
        Integer specialty = doctor.getChuyenKhoa();
        if (!"Bác sĩ".equals(doctor.getChucVu())
                || specialty == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Nhân viên không phải bác sĩ CLS hợp lệ");
        }
        return doctor;
    }

    public NhanVien getClsDoctorIfAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return null;
        }
        Integer accountId = authentication.getDetails() instanceof Integer id ? id : null;
        TaiKhoan account = accountId == null ? null : taiKhoanRepository.findById(accountId).orElse(null);
        if (account == null || !authentication.getName().equals(account.getUsername())
                || !Boolean.TRUE.equals(account.getHoatDong()) || account.getMaNhanVien() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản nhân viên không hợp lệ");
        }
        String role = account.getVaiTro();
        return role != null && (role.equals("BAC_SI") || role.startsWith("BAC_SI_"))
                ? requireClsDoctor() : null;
    }

    public void requireDoctorOwnsPendingResult(Integer maBacSi, String trangThai, Integer maBacSiXuLy) {
        if ("CHO_DUYET".equals(trangThai)
                && (maBacSiXuLy == null || !maBacSi.equals(maBacSiXuLy))) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Kết quả đang được bác sĩ khác xử lý.");
        }
    }

    public ChiTietChiDinh requireTechnicianClsDetail(
            Integer detailId, Integer maPhieuKham, String expectedServiceType) {
        ChiTietChiDinh detail = findClsDetail(detailId, expectedServiceType);
        if (detail.getMaPhieuChiDinh() == null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Chi tiết dịch vụ chưa liên kết phiếu chỉ định");
        }
        PhieuChiDinh order = phieuChiDinhRepository.findById(detail.getMaPhieuChiDinh())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.CONFLICT, "Không tìm thấy phiếu chỉ định của chi tiết dịch vụ"));
        if (order.getMaPhieuKham() == null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Phiếu chỉ định chưa liên kết phiếu khám");
        }
        PhieuKham visit = phieuKhamRepository.findById(order.getMaPhieuKham())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.CONFLICT, "Không tìm thấy phiếu khám của chi tiết dịch vụ"));
        if (maPhieuKham != null && !maPhieuKham.equals(visit.getMaPhieuKham())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Chi tiết dịch vụ không thuộc phiếu khám được yêu cầu");
        }
        return detail;
    }

    public ChiTietChiDinh requireAuthorizedClsDetail(
            Integer detailId, NhanVien doctor, String expectedServiceType) {
        ChiTietChiDinh detail = findClsDetail(detailId, expectedServiceType);
        String source = detail.getNguonTao();
        if (!"DANG_KY_TRUC_TIEP".equals(source)
                && !"BAC_SI_CHI_DINH".equals(source)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Chi tiết dịch vụ chưa thuộc nguồn CLS được bác sĩ xử lý");
        }

        DichVu service = findService(detail);
        if (!doctor.getChuyenKhoa().equals(service.getMaChuyenKhoa())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Dịch vụ không thuộc chuyên khoa của bác sĩ đăng nhập");
        }

        if ("DANG_KY_TRUC_TIEP".equals(source)) {
            if (!doctor.getMaNhanVien().equals(detail.getMaBacSi())) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN, "Bác sĩ không phụ trách chi tiết dịch vụ này");
            }
            if (detail.getMaPhieuChiDinh() == null) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT, "Chi tiết dịch vụ chưa liên kết phiếu chỉ định");
            }
            PhieuChiDinh order = phieuChiDinhRepository.findById(detail.getMaPhieuChiDinh())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.CONFLICT, "Không tìm thấy phiếu chỉ định của chi tiết dịch vụ"));
            if (order.getMaPhieuKham() == null || detail.getMaDichVu() == null
                    || !dangKyKhamBenhRepository.existsByMaPhieuKhamAndMaDichVuAndMaBacSi(
                            order.getMaPhieuKham(), detail.getMaDichVu(), doctor.getMaNhanVien())) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN, "Không tìm thấy phân công bác sĩ trong đăng ký CLS");
            }
        }
        return detail;
    }

    public ChiTietChiDinh findClsDetail(Integer detailId, String expectedServiceType) {
        ChiTietChiDinh detail = chiTietRepository.findById(detailId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy chi tiết chỉ định"));
        DichVu service = findService(detail);
        if (!isClsType(service.getLoaiDichVu())
                || (expectedServiceType != null && !expectedServiceType.equals(service.getLoaiDichVu()))) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Chi tiết không thuộc dịch vụ CLS hợp lệ");
        }
        return detail;
    }

    private DichVu findService(ChiTietChiDinh detail) {
        if (detail.getMaDichVu() == null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Chi tiết chỉ định chưa có dịch vụ hợp lệ");
        }
        return dichVuRepository.findById(detail.getMaDichVu())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.CONFLICT, "Không tìm thấy dịch vụ của chi tiết chỉ định"));
    }

    private TaiKhoan requireActiveStaffAccount() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Chưa xác thực");
        }
        Integer accountId = authentication.getDetails() instanceof Integer id ? id : null;
        TaiKhoan account = accountId == null
                ? null
                : taiKhoanRepository.findById(accountId).orElse(null);
        if (account == null || !authentication.getName().equals(account.getUsername())
                || !Boolean.TRUE.equals(account.getHoatDong())
                || account.getMaNhanVien() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản nhân viên không hợp lệ");
        }
        return account;
    }

    private NhanVien findEmployee(Integer employeeId) {
        return nhanVienRepository.findById(employeeId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN, "Không tìm thấy nhân viên đăng nhập"));
    }

    private boolean isClsType(String type) {
        return "CLS_XET_NGHIEM".equals(type) || "CLS_CHAN_DOAN_HINH_ANH".equals(type);
    }
}
