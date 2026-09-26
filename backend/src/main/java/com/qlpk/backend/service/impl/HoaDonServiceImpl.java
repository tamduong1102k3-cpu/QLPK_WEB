package com.qlpk.backend.service.impl;

import com.qlpk.backend.entity.*;
import com.qlpk.backend.entity.EventType;
import com.qlpk.backend.payment.WebSocketPublisher;
import com.qlpk.backend.repository.*;
import com.qlpk.backend.service.HoaDonService;
import com.qlpk.backend.service.ThongBaoService;
import com.qlpk.backend.entity.TaiKhoanBenhNhan;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class HoaDonServiceImpl implements HoaDonService {

    @Autowired
    private HoaDonRepository repository;

    @Autowired
    private ChiTietHoaDonRepository chiTietRepository;

    @Autowired
    private PhieuKhamRepository phieuKhamRepository;

    @Autowired
    private PhieuChiDinhRepository phieuChiDinhRepository;

    @Autowired
    private ChiTietChiDinhRepository chiTietChiDinhRepository;

    @Autowired
    private ToaThuocRepository toaThuocRepository;

    @Autowired
    private ChiTietToaThuocRepository chiTietToaThuocRepository;

    @Autowired
    private DichVuRepository dichVuRepository;

    @Autowired
    private ThuocRepository thuocRepository;

    @Autowired
    private DangKyKhamBenhRepository dangKyRepository;

    @Autowired
    private WebSocketPublisher webSocketPublisher;

    @Autowired
    private ThongBaoService thongBaoService;

    @Autowired
    private TaiKhoanBenhNhanRepository taiKhoanBenhNhanRepository;

    @Autowired
    private TaiKhoanRepository taiKhoanRepository;

    @Override
    public List<HoaDon> getAll() {
        return repository.findAll();
    }

    @Override
    public HoaDon getById(Integer id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public HoaDon create(HoaDon entity) {
        return repository.save(entity);
    }

    @Override
    public HoaDon update(Integer id, HoaDon entity) {
        if (repository.existsById(id)) {
            return repository.save(entity);
        }
        return null;
    }

    @Override
    public void delete(Integer id) {
        repository.deleteById(id);
    }

    private void taoThongBaoThanhToanChoBenhNhan(HoaDon hoaDon, Integer maNhanVien, Integer maTaiKhoanNhanVien) {
        try {

            if (maTaiKhoanNhanVien == null) {
                System.err.println("Bỏ qua tạo thông báo thanh toán: thiếu maTaiKhoanNhanVien (thu ngân chưa có mã tài khoản). maHoaDon="
                        + (hoaDon != null ? hoaDon.getMaHoaDon() : "null"));
                return;
            }
            if (hoaDon.getMaPhieuKham() == null) {
                return;
            }

            PhieuKham phieuKham = phieuKhamRepository.findById(hoaDon.getMaPhieuKham()).orElse(null);
            if (phieuKham == null || phieuKham.getMaBenhNhan() == null) {
                return;
            }

            Integer maBenhNhan = phieuKham.getMaBenhNhan();
            String tieuDe = "Thanh toán thành công";
            String noiDung = "Hóa đơn #" + hoaDon.getMaHoaDon() + " đã được thanh toán thành công với số tiền " 
                           + (hoaDon.getTongTien() != null ? hoaDon.getTongTien().toString() : "0") + " VNĐ.";

            if (maBenhNhan != null) {
                TaiKhoanBenhNhan taiKhoan = taiKhoanBenhNhanRepository.findByMaBenhNhan(maBenhNhan).orElse(null);
                if (taiKhoan != null) {

                    thongBaoService.createThongBao(
                        taiKhoan.getMaTaiKhoanBn(),
                        maTaiKhoanNhanVien,
                        "BENH_NHAN",
                        tieuDe,
                        noiDung,
                        "HOA_DON",
                        hoaDon.getMaHoaDon().toString(),
                        EventType.PAYMENT_SUCCESS.name(),
                        false,
                        true
                    );
                } else {
                    System.err.println("Không tìm thấy tài khoản cho maBenhNhan=" + maBenhNhan + ", bỏ qua tạo ThongBao");
                }
            }
        } catch (Exception e) {

            System.err.println("Lỗi khi tạo thông báo thanh toán cho bệnh nhân: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public HoaDon thanhToan(Integer maHoaDon, Integer maNhanVien, Integer maTaiKhoanNhanVien, String phuongThuc, BigDecimal soTienNhan, String maGiaoDich) {
        HoaDon hoaDon = repository.findById(maHoaDon)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn với mã: " + maHoaDon));

        if ("da thanh toan".equalsIgnoreCase(hoaDon.getTrangThai())) {
            throw new RuntimeException("Hóa đơn #" + maHoaDon + " đã được thanh toán trước đó!");
        }

        if ("huy".equalsIgnoreCase(hoaDon.getTrangThai())) {
            throw new RuntimeException("Hóa đơn #" + maHoaDon + " đã bị hủy!");
        }

        if (soTienNhan != null && soTienNhan.compareTo(hoaDon.getTongTien()) < 0) {
            throw new RuntimeException("Số tiền nhận (" + soTienNhan + ") không đủ để thanh toán (" + hoaDon.getTongTien() + ")");
        }

        hoaDon.setTrangThai("da thanh toan");
        hoaDon.setNgayThanhToan(LocalDateTime.now());
        hoaDon.setPhuongThucThanhToan(phuongThuc);
        hoaDon.setMaGiaoDich(maGiaoDich);
        if (maNhanVien != null) {
            hoaDon.setMaNhanVien(maNhanVien);
        }

        HoaDon saved = repository.save(hoaDon);
        if (webSocketPublisher != null) {
            webSocketPublisher.publishHoaDonChange("PAID", saved.getMaHoaDon());
        }

        if (hoaDon.getMaPhieuKham() != null) {
            List<ChiTietHoaDon> ctList = chiTietRepository.findByMaHoaDon(maHoaDon);
            boolean hasThuoc = ctList.stream().anyMatch(ct -> "THUOC".equalsIgnoreCase(ct.getLoaiMuc()));
            if (hasThuoc) {

                toaThuocRepository.updateTrangThaiChoCapThuocByPhieuKham(
                    hoaDon.getMaPhieuKham(),
                    LocalDateTime.now().plusHours(24)
                );
            }
        }

        taoThongBaoThanhToanChoBenhNhan(saved, maNhanVien, maTaiKhoanNhanVien);

        return saved;
    }

    @Override
    public Map<String, Object> getBillingItems(Integer maPhieuKham) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> services = new ArrayList<>();
        List<Map<String, Object>> medicines = new ArrayList<>();
        BigDecimal tongDichVu = BigDecimal.ZERO;
        BigDecimal tongThuoc = BigDecimal.ZERO;

        PhieuKham pk = phieuKhamRepository.findById(maPhieuKham).orElse(null);
        if (pk != null && pk.getMaDichVu() != null) {
            DichVu dv = dichVuRepository.findById(pk.getMaDichVu()).orElse(null);
            if (dv != null) {
                BigDecimal donGia = dv.getDonGia() != null ? dv.getDonGia() : BigDecimal.ZERO;
                BigDecimal thanhTien = donGia;
                tongDichVu = tongDichVu.add(thanhTien);

                Map<String, Object> item = new HashMap<>();
                item.put("idGoc", pk.getMaDichVu());
                item.put("noiDung", dv.getTenDichVu() + " (Khám)");
                item.put("loaiMuc", "DICH_VU");
                item.put("soLuong", 1);
                item.put("donGia", donGia);
                item.put("thanhTien", thanhTien);
                services.add(item);
            }
        }

        Integer maDichVuKhamChinh = (pk != null) ? pk.getMaDichVu() : null;
        List<PhieuChiDinh> pcdList = phieuChiDinhRepository.findByMaPhieuKham(maPhieuKham);
        for (PhieuChiDinh pcd : pcdList) {
            List<ChiTietChiDinh> details = chiTietChiDinhRepository.findByMaPhieuChiDinh(pcd.getMaPhieuChiDinh());
            if (details == null) continue;
            for (ChiTietChiDinh ct : details) {

                if (maDichVuKhamChinh != null && maDichVuKhamChinh.equals(ct.getMaDichVu())) {
                    continue;
                }
                String tenDv = "Dịch vụ #" + ct.getMaDichVu();
                DichVu dv = dichVuRepository.findById(ct.getMaDichVu()).orElse(null);
                if (dv != null) tenDv = dv.getTenDichVu();

                BigDecimal donGia = BigDecimal.ZERO;
                if (ct.getDonGia() != null && ct.getDonGia() > 0) {
                    donGia = BigDecimal.valueOf(ct.getDonGia());
                } else if (dv != null && dv.getDonGia() != null) {
                    donGia = dv.getDonGia();
                }
                int soLuong = ct.getSoLuong() != null ? ct.getSoLuong() : 1;
                BigDecimal thanhTien = donGia.multiply(BigDecimal.valueOf(soLuong));
                tongDichVu = tongDichVu.add(thanhTien);

                Map<String, Object> item = new HashMap<>();
                item.put("idGoc", ct.getId());
                item.put("noiDung", tenDv);
                item.put("loaiMuc", "DICH_VU");
                item.put("soLuong", soLuong);
                item.put("donGia", donGia);
                item.put("thanhTien", thanhTien);
                services.add(item);
            }
        }

        List<ToaThuoc> toaThuocList = toaThuocRepository.findByMaPhieuKham(maPhieuKham);
        for (ToaThuoc toa : toaThuocList) {
            List<ChiTietToaThuoc> details = chiTietToaThuocRepository.findByMaToaThuoc(toa.getMaToaThuoc());
            if (details == null) continue;
            for (ChiTietToaThuoc ct : details) {
                String tenThuoc = "Thuốc #" + ct.getMaThuoc();
                BigDecimal donGiaBan = BigDecimal.ZERO;
                Thuoc thuoc = thuocRepository.findById(ct.getMaThuoc()).orElse(null);
                if (thuoc != null) {
                    tenThuoc = thuoc.getTenThuoc();
                    donGiaBan = thuoc.getDonGiaBan() != null ? thuoc.getDonGiaBan() : BigDecimal.ZERO;
                }

                int soLuong = 1;
                if (ct.getSoNgay() != null && ct.getSoNgay() > 0) {
                    int lieuMoiNgay = 0;
                    if (ct.getSang() != null && !ct.getSang().trim().isEmpty() && !ct.getSang().equals("0")) lieuMoiNgay++;
                    if (ct.getTrua() != null && !ct.getTrua().trim().isEmpty() && !ct.getTrua().equals("0")) lieuMoiNgay++;
                    if (ct.getChieu() != null && !ct.getChieu().trim().isEmpty() && !ct.getChieu().equals("0")) lieuMoiNgay++;
                    if (ct.getToi() != null && !ct.getToi().trim().isEmpty() && !ct.getToi().equals("0")) lieuMoiNgay++;
                    if (lieuMoiNgay == 0) lieuMoiNgay = 1;
                    soLuong = lieuMoiNgay * ct.getSoNgay();
                }
                BigDecimal thanhTien = donGiaBan.multiply(BigDecimal.valueOf(soLuong));
                tongThuoc = tongThuoc.add(thanhTien);

                Map<String, Object> item = new HashMap<>();
                item.put("idGoc", ct.getId());
                item.put("noiDung", tenThuoc);
                item.put("loaiMuc", "THUOC");
                item.put("soLuong", soLuong);
                item.put("donGia", donGiaBan);
                item.put("thanhTien", thanhTien);
                medicines.add(item);
            }
        }

        result.put("dichVu", services);
        result.put("thuoc", medicines);
        result.put("tongDichVu", tongDichVu);
        result.put("tongThuoc", tongThuoc);
        result.put("tongCong", tongDichVu.add(tongThuoc));
        return result;
    }

    @Override
    @Transactional
    public HoaDon taoHoaDonTuPhieuKham(Integer maPhieuKham, Integer maNhanVien) throws Exception {
        PhieuKham pk = phieuKhamRepository.findById(maPhieuKham)
                .orElseThrow(() -> new Exception("Không tìm thấy phiếu khám #" + maPhieuKham));

        List<HoaDon> existing = repository.findByMaPhieuKham(maPhieuKham);
        if (existing != null && !existing.isEmpty()) {
            return existing.get(0);
        }

        Map<String, Object> billingItems = getBillingItems(maPhieuKham);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> services = (List<Map<String, Object>>) billingItems.get("dichVu");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> medicines = (List<Map<String, Object>>) billingItems.get("thuoc");
        BigDecimal tongCong = (BigDecimal) billingItems.get("tongCong");

        HoaDon hoaDon = new HoaDon();
        hoaDon.setMaPhieuKham(maPhieuKham);
        hoaDon.setMaNhanVien(maNhanVien);
        hoaDon.setTongTien(tongCong);

        hoaDon.setTrangThai("chua thanh toan");
        hoaDon.setPhuongThucThanhToan("chua_xac_dinh");
        hoaDon = repository.save(hoaDon);
        if (webSocketPublisher != null) {
            webSocketPublisher.publishHoaDonChange("CREATED", hoaDon.getMaHoaDon());
        }

        for (Map<String, Object> item : services) {
            ChiTietHoaDon ct = new ChiTietHoaDon();
            ct.setMaHoaDon(hoaDon.getMaHoaDon());
            ct.setNoiDung((String) item.get("noiDung"));
            ct.setLoaiMuc("DICH_VU");
            ct.setIdGoc((Integer) item.get("idGoc"));
            ct.setSoLuong((Integer) item.get("soLuong"));
            ct.setDonGia((BigDecimal) item.get("donGia"));
            ct.setThanhTien((BigDecimal) item.get("thanhTien"));
            chiTietRepository.save(ct);
        }
        for (Map<String, Object> item : medicines) {
            ChiTietHoaDon ct = new ChiTietHoaDon();
            ct.setMaHoaDon(hoaDon.getMaHoaDon());
            ct.setNoiDung((String) item.get("noiDung"));
            ct.setLoaiMuc("THUOC");
            ct.setIdGoc((Integer) item.get("idGoc"));
            ct.setSoLuong((Integer) item.get("soLuong"));
            ct.setDonGia((BigDecimal) item.get("donGia"));
            ct.setThanhTien((BigDecimal) item.get("thanhTien"));
            chiTietRepository.save(ct);
        }

        return hoaDon;
    }

    @Override
    public List<Map<String, Object>> getPaidInvoicesDetailed() {
        return repository.findPaidInvoicesDetailed();
    }

    @Override
    public List<Map<String, Object>> getPaidInvoicesWithThuoc() {
        return repository.findPaidInvoicesWithThuoc();
    }

    @Override
    public List<Map<String, Object>> getPaidInvoicesWithThuocAndStatus() {
        return repository.findPaidInvoicesWithThuocAndStatus();
    }

    @Override
    public List<Map<String, Object>> getPaidInvoicesDaCapThuoc() {
        return repository.findPaidInvoicesDaCapThuoc();
    }

    @Override
    public void taoThongBaoThanhToan(Integer maHoaDon) {
        HoaDon hoaDon = repository.findById(maHoaDon)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn với mã: " + maHoaDon));

        if (!"da thanh toan".equalsIgnoreCase(hoaDon.getTrangThai())) {
            throw new RuntimeException("Hóa đơn #" + maHoaDon + " chưa được thanh toán, không thể tạo thông báo!");
        }

        taoThongBaoThanhToanChoBenhNhan(hoaDon, null, null);
    }
}
