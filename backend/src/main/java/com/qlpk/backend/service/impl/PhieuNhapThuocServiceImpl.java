package com.qlpk.backend.service.impl;

import com.qlpk.backend.entity.ChiTietPhieuNhapThuoc;
import com.qlpk.backend.entity.KhoThuoc;
import com.qlpk.backend.entity.PhieuNhapThuoc;
import com.qlpk.backend.entity.Thuoc;
import com.qlpk.backend.payment.WebSocketPublisher;
import com.qlpk.backend.repository.ChiTietPhieuNhapThuocRepository;
import com.qlpk.backend.repository.KhoThuocRepository;
import com.qlpk.backend.repository.PhieuNhapThuocRepository;
import com.qlpk.backend.repository.ThuocRepository;
import com.qlpk.backend.service.PhieuNhapThuocService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class PhieuNhapThuocServiceImpl implements PhieuNhapThuocService {

    @Autowired
    private PhieuNhapThuocRepository repository;

    @Autowired
    private ChiTietPhieuNhapThuocRepository chiTietRepository;

    @Autowired
    private KhoThuocRepository khoThuocRepository;

    @Autowired
    private ThuocRepository thuocRepository;

    @Autowired
    private WebSocketPublisher webSocketPublisher;

    @Override
    public List<PhieuNhapThuoc> getAll() {
        return repository.findAll();
    }

    @Override
    public PhieuNhapThuoc getById(Integer id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public PhieuNhapThuoc create(PhieuNhapThuoc entity) {
        return repository.save(entity);
    }

    @Override
    public PhieuNhapThuoc update(Integer id, PhieuNhapThuoc entity) {
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
    public PhieuNhapThuoc createPhieuNhap(Map<String, Object> request) throws Exception {
        PhieuNhapThuoc phieu = new PhieuNhapThuoc();
        phieu.setNgayNhap(java.time.LocalDateTime.now());
        phieu.setMaNhanVienNhap((Integer) request.get("maNhanVienNhap"));
        phieu.setMaNhaCungCap((Integer) request.get("maNhaCungCap"));
        phieu.setTongTienNhap(new java.math.BigDecimal(request.get("tongTienNhap").toString()));
        phieu.setTrangThai("Hoan thanh");
        phieu.setGhiChu((String) request.get("ghiChu"));

        PhieuNhapThuoc savedPhieu = repository.save(phieu);

        List<Map<String, Object>> details = (List<Map<String, Object>>) request.get("chiTiet");
        for (Map<String, Object> item : details) {
            Integer maThuoc = (Integer) item.get("maThuoc");
            Integer sl = (Integer) item.get("soLuongNhap");
            java.math.BigDecimal gia = new java.math.BigDecimal(item.get("donGiaNhap").toString());

            ChiTietPhieuNhapThuoc ct = new ChiTietPhieuNhapThuoc();
            ct.setMaPhieuNhapThuoc(savedPhieu.getMaPhieuNhapThuoc());
            ct.setMaThuoc(maThuoc);
            ct.setSoLuongNhap(sl);
            ct.setDonGiaNhap(gia);
            ct.setThanhTien(gia.multiply(new java.math.BigDecimal(sl)));
            if (item.get("maNcc") != null) {
                ct.setMaNcc((Integer) item.get("maNcc"));
            }
            chiTietRepository.save(ct);

            KhoThuoc kho = khoThuocRepository.findByMaThuoc(maThuoc)
                    .orElse(new KhoThuoc());
            if (kho.getMaThuoc() == null) {
                kho.setMaThuoc(maThuoc);
                kho.setSoLuongTon(0);
            }
            kho.setSoLuongTon(kho.getSoLuongTon() + sl);
            kho.setNgayCapNhatCuoi(java.time.LocalDateTime.now());
            khoThuocRepository.save(kho);

            checkAndPublishAlert(maThuoc, kho.getSoLuongTon());
        }

        webSocketPublisher.publishKhoUpdate();

        return savedPhieu;
    }

    private void checkAndPublishAlert(Integer maThuoc, Integer soLuongTon) {
        String trangThai;
        if (soLuongTon == null || soLuongTon <= 0) {
            trangThai = "HẾT_HÀNG";
        } else if (soLuongTon < 20) {
            trangThai = "CẢNH_BÁO";
        } else if (soLuongTon <= 50) {
            trangThai = "SẮP_HẾT";
        } else {
            return; 
        }

        String tenThuoc = "N/A";
        Thuoc thuoc = thuocRepository.findById(maThuoc).orElse(null);
        if (thuoc != null) {
            tenThuoc = thuoc.getTenThuoc();
        }

        webSocketPublisher.publishKhoAlert("ALERT", maThuoc, tenThuoc, soLuongTon, trangThai);
    }
}
