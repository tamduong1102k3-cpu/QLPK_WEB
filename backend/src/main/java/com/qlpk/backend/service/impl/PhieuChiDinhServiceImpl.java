package com.qlpk.backend.service.impl;

import com.qlpk.backend.dto.ReferralRequest;
import com.qlpk.backend.entity.*;
import com.qlpk.backend.repository.*;
import com.qlpk.backend.service.PhieuChiDinhService;
import com.qlpk.backend.payment.WebSocketPublisher;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

@Service
public class PhieuChiDinhServiceImpl implements PhieuChiDinhService {

    @Autowired private PhieuChiDinhRepository repository;
    @Autowired private ChiTietChiDinhRepository chiTietRepository;
    @Autowired private KetQuaXetNghiemRepository ketQuaXetNghiemRepository;
    @Autowired private ChiTietKetQuaXnRepository chiTietKetQuaXnRepository;
    @Autowired private ChiTietXetNghiemRepository chiTietXetNghiemRepository;
    @Autowired private KetQuaCdhaRepository ketQuaCdhaRepository;
    @Autowired private DangKyKhamBenhRepository dangKyKhamBenhRepository;
    @Autowired private DichVuRepository dichVuRepository;
    @Autowired private PhieuKhamRepository phieuKhamRepository;
    @Autowired private WebSocketPublisher webSocketPublisher;
    @Autowired private LichKhamRepository lichKhamRepository;
    @Autowired private NhanVienRepository nhanVienRepository;

    @Override public List<PhieuChiDinh> getAll() { return repository.findAll(); }
    @Override public PhieuChiDinh getById(Integer id) { return repository.findById(id).orElse(null); }
    @Override public PhieuChiDinh create(PhieuChiDinh entity) { return repository.save(entity); }
    @Override public PhieuChiDinh update(Integer id, PhieuChiDinh entity) { return repository.save(entity); }
    @Override public void delete(Integer id) { repository.deleteById(id); }

    @Override
    public List<Map<String, Object>> getPendingTests(Integer maChuyenKhoa) {
        return repository.findPendingTests(maChuyenKhoa);
    }

    @Override
    public List<Map<String, Object>> getCompletedTestsToday(Integer maChuyenKhoa) {
        return repository.findCompletedTestsToday(maChuyenKhoa);
    }

    @Override
    @Transactional
    public void submitTestResult(Map<String, Object> body) throws Exception {
        Integer detailId = null;
        if (body.get("id") != null) detailId = Integer.valueOf(body.get("id").toString());
        Integer maPhieuKham = null;
        if (body.get("maPhieuKham") != null) maPhieuKham = Integer.valueOf(body.get("maPhieuKham").toString());
        String ketQua = (String) body.get("ketQua");
        Integer maNhanVienThucHien = null;
        if (body.get("maNhanVienThucHien") != null) maNhanVienThucHien = Integer.valueOf(body.get("maNhanVienThucHien").toString());
        String tenDichVu = (String) body.get("tenDichVu");

        if (detailId == null || maPhieuKham == null || ketQua == null) {
            throw new Exception("Thiếu thông tin bắt buộc");
        }

        var detailOpt = chiTietRepository.findById(detailId);
        if (detailOpt.isEmpty()) throw new Exception("Không tìm thấy chi tiết chỉ định");

        ChiTietChiDinh detail = detailOpt.get();
        detail.setTrangThaiDv("DA_THUC_HIEN");
        if (maNhanVienThucHien != null) detail.setMaNhanVienThucHien(maNhanVienThucHien);
        chiTietRepository.save(detail);

        String templateKey = body.get("templateKey") != null ? body.get("templateKey").toString() : null;
        DichVu dv = dichVuRepository.findById(detail.getMaDichVu()).orElse(null);
        boolean isCdha = dv != null && "CLS_CHAN_DOAN_HINH_ANH".equals(dv.getLoaiDichVu());
        boolean isRadioTemplate = "ULTRASOUND".equals(templateKey) || "XRAY".equals(templateKey)
                || "CT_SCAN".equals(templateKey) || "CDHA_GENERIC".equals(templateKey);

        if (isCdha || isRadioTemplate) {

            KetQuaCdha kqcdha = ketQuaCdhaRepository.findByIdChiTietChiDinh(detailId)
                    .orElse(new KetQuaCdha());

            kqcdha.setIdChiTietChiDinh(detailId);
            kqcdha.setNgayThucHien(LocalDateTime.now());
            kqcdha.setMaNhanVienThucHien(maNhanVienThucHien);

            if (body.get("duongDanAnh1") != null) kqcdha.setDuongDanAnh1(body.get("duongDanAnh1").toString());
            if (body.get("duongDanAnh2") != null) kqcdha.setDuongDanAnh2(body.get("duongDanAnh2").toString());
            if (body.get("deNghi") != null) kqcdha.setDeNghi(body.get("deNghi").toString());

            String moTa = ketQua;
            if (body.get("templateValues") != null) {
                Map<String, Object> tVals = (Map<String, Object>) body.get("templateValues");
                if (tVals.get("mo_ta") != null) moTa = tVals.get("mo_ta").toString();
                if (tVals.get("de_nghi") != null && body.get("deNghi") == null) {
                    kqcdha.setDeNghi(tVals.get("de_nghi").toString());
                }
                if (tVals.get("duong_dan_anh_1") != null) kqcdha.setDuongDanAnh1(tVals.get("duong_dan_anh_1").toString());
                if (tVals.get("duong_dan_anh_2") != null) kqcdha.setDuongDanAnh2(tVals.get("duong_dan_anh_2").toString());
            }
            kqcdha.setMoTaHinhAnh(moTa);

            if (!"DA_DUYET".equals(kqcdha.getTrangThai())) {
                kqcdha.setTrangThai("CHO_DUYET");
            }
            ketQuaCdhaRepository.save(kqcdha);
        } else {

            KetQuaXetNghiem kqxn = ketQuaXetNghiemRepository.findByMaChiTietChiDinh(detailId)
                    .orElse(new KetQuaXetNghiem());

            kqxn.setMaChiTietChiDinh(detailId);
            kqxn.setNgayThucHien(LocalDateTime.now());
            kqxn.setNguoiThucHien(maNhanVienThucHien);

            kqxn.setKetQua(ketQua);

            if (body.get("ghiChuThem") != null) kqxn.setGhiChuThem(body.get("ghiChuThem").toString());

            if (!"DA_DUYET".equals(kqxn.getTrangThai())) {
                if (body.get("trangThai") != null) kqxn.setTrangThai(body.get("trangThai").toString());
                else kqxn.setTrangThai("CHO_DUYET");
            }

            ketQuaXetNghiemRepository.save(kqxn);

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

        if (webSocketPublisher != null) {
            String loai = "XET_NGHIEM";
            if (isCdha) {
                loai = "CDHA";
            }
            webSocketPublisher.publishClsChange("SUBMITTED", maPhieuKham, loai);
        }
    }

    @Override
    public List<Map<String, Object>> getPendingApprovalList(Integer maChuyenKhoa) {
        return repository.findPendingApprovalList(maChuyenKhoa);
    }

    @Override
    public List<Map<String, Object>> getApprovedList(Integer maChuyenKhoa) {
        return repository.findApprovedList(maChuyenKhoa);
    }

    @Override
    @Transactional
    public PhieuChiDinh create(ReferralRequest request) throws Exception {
        PhieuChiDinh pk = request.getPhieuChiDinh();
        List<ChiTietChiDinh> details = request.getChiTietList();

        if (pk.getMaPhieuKham() != null) {
            List<PhieuChiDinh> existingPcds = repository.findByMaPhieuKham(pk.getMaPhieuKham());
            if (existingPcds != null && !existingPcds.isEmpty()) {
                for (PhieuChiDinh oldPcd : existingPcds) {
                    List<ChiTietChiDinh> oldDetails = chiTietRepository.findByMaPhieuChiDinh(oldPcd.getMaPhieuChiDinh());
                    boolean allChuaThucHien = true;
                    if (oldDetails != null) {
                        for (ChiTietChiDinh od : oldDetails) {
                            if ("DA_THUC_HIEN".equals(od.getTrangThaiDv())) {
                                allChuaThucHien = false;
                                break;
                            }
                        }
                    }
                    if (allChuaThucHien) {
                        if (oldDetails != null && !oldDetails.isEmpty()) {
                            chiTietRepository.deleteAll(oldDetails);
                        }
                        repository.delete(oldPcd);
                    }
                }
            }
        }

        if (details == null || details.isEmpty()) {
            return null;
        }

        if (pk.getNgayChiDinh() == null) pk.setNgayChiDinh(LocalDateTime.now());
        PhieuChiDinh savedPk = repository.save(pk);

        for (ChiTietChiDinh item : details) {
            item.setMaPhieuChiDinh(savedPk.getMaPhieuChiDinh());
            if (item.getTrangThaiDv() == null) item.setTrangThaiDv("CHUA_THUC_HIEN");

            if (item.getDonGia() == null || item.getDonGia() <= 0) {
                if (item.getMaDichVu() != null) {
                    DichVu dvv = dichVuRepository.findById(item.getMaDichVu()).orElse(null);
                    if (dvv != null && dvv.getDonGia() != null) {
                        item.setDonGia(dvv.getDonGia().doubleValue());
                    }
                }
            }

            chiTietRepository.save(item);
        }
        return savedPk;
    }

    @Override
    public List<PhieuChiDinh> getByPhieuKham(Integer maPhieuKham) {
        return repository.findByMaPhieuKham(maPhieuKham);
    }

    @Override
    public List<PhieuChiDinh> getByBenhNhan(Integer maBenhNhan) {
        return repository.findByMaBenhNhan(maBenhNhan);
    }

    @Override
    public List<ChiTietChiDinh> getDetails(Integer id) {
        return chiTietRepository.findByMaPhieuChiDinh(id);
    }

    @Override
    public Object getCdhaResult(Integer detailId) {
        return ketQuaCdhaRepository.findByIdChiTietChiDinh(detailId).orElse(null);
    }

    @Override
    public Object getXetNhiemResult(Integer detailId) {
        var kqOpt = ketQuaXetNghiemRepository.findByMaChiTietChiDinh(detailId);
        if (kqOpt.isPresent()) {
            KetQuaXetNghiem kq = kqOpt.get();
            Map<String, Object> response = new HashMap<>();
            response.put("id", kq.getId());
            response.put("maChiTietChiDinh", kq.getMaChiTietChiDinh());
            response.put("ngayThucHien", kq.getNgayThucHien());
            response.put("nguoiThucHien", kq.getNguoiThucHien());

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
    public List<Map<String, Object>> getXetNhiemResultsByPhieuKham(Integer maPhieuKham) {
        List<PhieuChiDinh> pcdList = repository.findByMaPhieuKham(maPhieuKham);
        List<Map<String, Object>> responseList = new java.util.ArrayList<>();

        for (PhieuChiDinh pcd : pcdList) {
            List<ChiTietChiDinh> details = chiTietRepository.findByMaPhieuChiDinh(pcd.getMaPhieuChiDinh());
            for (ChiTietChiDinh detail : details) {
                var kqOpt = ketQuaXetNghiemRepository.findByMaChiTietChiDinh(detail.getId());
                if (kqOpt.isPresent()) {
                    var kq = kqOpt.get();

                    String tenDichVu = dichVuRepository.findById(detail.getMaDichVu())
                            .map(DichVu::getTenDichVu).orElse("Dịch vụ xét nghiệm");

                    Map<String, Object> response = new HashMap<>();
                    response.put("id", kq.getId());
                    response.put("maChiTietChiDinh", kq.getMaChiTietChiDinh());
                    response.put("tenDichVu", tenDichVu);
                    response.put("ngayThucHien", kq.getNgayThucHien());
                    response.put("nguoiThucHien", kq.getNguoiThucHien());

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

    private boolean isClsService(DichVu dichVu) {
        if (dichVu == null || dichVu.getLoaiDichVu() == null) return false;
        String loai = dichVu.getLoaiDichVu();
        return "CLS_XET_NGHIEM".equals(loai) || "CLS_CHAN_DOAN_HINH_ANH".equals(loai);
    }

    private void completeIfClsService(PhieuKham phieuKham) {
        if (phieuKham == null || phieuKham.getMaDichVu() == null) return;

        DichVu dichVu = dichVuRepository.findById(phieuKham.getMaDichVu()).orElse(null);
        if (isClsService(dichVu)) {
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
    }

    @Override
    @Transactional
    public void approveTestResult(Integer id, Map<String, Object> body) throws Exception {
        var kqOpt = ketQuaXetNghiemRepository.findById(id);
        if (kqOpt.isEmpty()) throw new Exception("Không tìm thấy kết quả");
        KetQuaXetNghiem kq = kqOpt.get();

        if (body.get("ketLuan") != null) kq.setKetLuan(body.get("ketLuan").toString());
        if (body.get("maBsKetLuan") != null) kq.setMaBsKetLuan(Integer.valueOf(body.get("maBsKetLuan").toString()));
        if (body.get("ghiChuThem") != null) kq.setGhiChuThem(body.get("ghiChuThem").toString());
        if (body.get("ketQua") != null) kq.setKetQua(body.get("ketQua").toString());

        boolean updateOnly = body.get("updateOnly") != null && Boolean.parseBoolean(body.get("updateOnly").toString());

        if (!updateOnly) {
            kq.setTrangThai("DA_DUYET");
        }
        ketQuaXetNghiemRepository.save(kq);

        if (updateOnly) return;

        chiTietRepository.findById(kq.getMaChiTietChiDinh()).ifPresent(detail -> {
            repository.findById(detail.getMaPhieuChiDinh()).ifPresent(pcd -> {
                if (webSocketPublisher != null) {
                    webSocketPublisher.publishClsChange("APPROVED", pcd.getMaPhieuKham(), "XET_NGHIEM");
                }
                phieuKhamRepository.findById(pcd.getMaPhieuKham()).ifPresent(pk -> {
                    DichVu dv = dichVuRepository.findById(pk.getMaDichVu()).orElse(null);
                    if (isClsService(dv)) {
                        Integer maBsDuyet = body.get("maBsKetLuan") != null ? Integer.valueOf(body.get("maBsKetLuan").toString()) : null;
                        if (maBsDuyet != null) {
                            pcd.setMaNhanVienChiDinh(maBsDuyet);
                            repository.save(pcd);
                        }
                    }
                    completeIfClsService(pk);
                });
            });
        });
    }

    @Override
    public List<Map<String, Object>> getApprovedHistory(Integer maBacSi) {
        return ketQuaXetNghiemRepository.findApprovedHistoryDetailed(maBacSi);
    }

    @Override
    @Transactional
    public void rejectTestResult(Integer id, Map<String, String> body) throws Exception {
        String reason = body.get("reason");
        if (reason == null || reason.trim().isEmpty()) throw new Exception("Vui lòng nhập lý do từ chối");

        KetQuaXetNghiem kq = ketQuaXetNghiemRepository.findById(id).orElse(null);
        if (kq == null) throw new Exception("Không tìm thấy kết quả");

        kq.setTrangThai("TU_CHOI");
        kq.setGhiChuThem(reason);
        ketQuaXetNghiemRepository.save(kq);

        chiTietRepository.findById(kq.getMaChiTietChiDinh()).ifPresent(detail -> {
            detail.setTrangThaiDv("CHUA_THUC_HIEN");
            chiTietRepository.save(detail);
            repository.findById(detail.getMaPhieuChiDinh()).ifPresent(pcd -> {
                if (webSocketPublisher != null) {
                    webSocketPublisher.publishClsChange("REJECTED", pcd.getMaPhieuKham(), "XET_NGHIEM");
                }
            });
        });
    }

    @Override
    public List<Map<String, Object>> getCdhaResultsByPhieuKham(Integer maPhieuKham) {
        List<PhieuChiDinh> pcdList = repository.findByMaPhieuKham(maPhieuKham);
        List<Map<String, Object>> responseList = new java.util.ArrayList<>();

        for (PhieuChiDinh pcd : pcdList) {
            List<ChiTietChiDinh> details = chiTietRepository.findByMaPhieuChiDinh(pcd.getMaPhieuChiDinh());
            for (ChiTietChiDinh detail : details) {
                var kqOpt = ketQuaCdhaRepository.findByIdChiTietChiDinh(detail.getId());
                if (kqOpt.isPresent()) {
                    var kq = kqOpt.get();
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
                    response.put("duongDanAnh1", kq.getDuongDanAnh1());
                    response.put("duongDanAnh2", kq.getDuongDanAnh2());
                    response.put("trangThaiDv", detail.getTrangThaiDv());
                    responseList.add(response);
                }
            }
        }
        return responseList;
    }

    @Override
    @Transactional
    public void approveCdhaResult(Integer detailId, Map<String, Object> body) throws Exception {
        var kqOpt = ketQuaCdhaRepository.findByIdChiTietChiDinh(detailId);
        KetQuaCdha kq = kqOpt.orElse(new KetQuaCdha());

        kq.setIdChiTietChiDinh(detailId);
        kq.setNgayThucHien(LocalDateTime.now());
        if (body.get("maBacSiThucHien") != null) kq.setMaBacSiThucHien(Integer.valueOf(body.get("maBacSiThucHien").toString()));
        if (body.get("moTaHinhAnh") != null) kq.setMoTaHinhAnh(body.get("moTaHinhAnh").toString());
        if (body.get("ketLuan") != null) kq.setKetLuan(body.get("ketLuan").toString());
        if (body.get("deNghi") != null) kq.setDeNghi(body.get("deNghi").toString());
        if (body.get("duongDanAnh1") != null) kq.setDuongDanAnh1(body.get("duongDanAnh1").toString());
        if (body.get("duongDanAnh2") != null) kq.setDuongDanAnh2(body.get("duongDanAnh2").toString());

        boolean updateOnly = body.get("updateOnly") != null && Boolean.parseBoolean(body.get("updateOnly").toString());

        if (!updateOnly) {
            kq.setTrangThai("DA_DUYET");
        }
        ketQuaCdhaRepository.save(kq);

        if (updateOnly) return;

        chiTietRepository.findById(detailId).ifPresent(detail -> {
            repository.findById(detail.getMaPhieuChiDinh()).ifPresent(pcd -> {
                if (webSocketPublisher != null) {
                    webSocketPublisher.publishClsChange("APPROVED", pcd.getMaPhieuKham(), "CDHA");
                }
                phieuKhamRepository.findById(pcd.getMaPhieuKham()).ifPresent(pk -> {
                    DichVu dv = dichVuRepository.findById(pk.getMaDichVu()).orElse(null);
                    if (isClsService(dv)) {
                        Integer maBsDuyet = body.get("maBacSiThucHien") != null ? Integer.valueOf(body.get("maBacSiThucHien").toString()) : null;
                        if (maBsDuyet != null) {
                            pcd.setMaNhanVienChiDinh(maBsDuyet);
                            repository.save(pcd);
                        }
                    }
                    completeIfClsService(pk);
                });
            });
        });
    }

    @Override
    @Transactional
    public void rejectCdhaResult(Integer detailId, Map<String, String> body) throws Exception {
        String reason = body.get("reason");
        if (reason == null || reason.trim().isEmpty()) throw new Exception("Vui lòng nhập lý do từ chối");

        var kqOpt = ketQuaCdhaRepository.findByIdChiTietChiDinh(detailId);
        if (kqOpt.isPresent()) {
            KetQuaCdha kq = kqOpt.get();
            kq.setDeNghi("YÊU CẦU LÀM LẠI: " + reason);
            kq.setTrangThai("TU_CHOI");
            ketQuaCdhaRepository.save(kq);
        }

        chiTietRepository.findById(detailId).ifPresent(detail -> {
            detail.setTrangThaiDv("CHUA_THUC_HIEN");
            chiTietRepository.save(detail);
            repository.findById(detail.getMaPhieuChiDinh()).ifPresent(pcd -> {
                if (webSocketPublisher != null) {
                    webSocketPublisher.publishClsChange("REJECTED", pcd.getMaPhieuKham(), "CDHA");
                }
            });
        });
    }
}
