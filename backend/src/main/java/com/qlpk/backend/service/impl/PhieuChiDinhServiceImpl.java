package com.qlpk.backend.service.impl;

import com.qlpk.backend.dto.ReferralRequest;
import com.qlpk.backend.entity.*;
import com.qlpk.backend.repository.*;
import com.qlpk.backend.service.PhieuChiDinhService;
import com.qlpk.backend.service.HanMucPhongService;
import com.qlpk.backend.payment.WebSocketPublisher;
import com.qlpk.backend.util.TimeUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

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
        return repository.findPendingTests(maChuyenKhoa);
    }

    /**
     * Lấy danh sách xét nghiệm đã hoàn thành trong ngày theo chuyên khoa.
     *
     * @param maChuyenKhoa mã chuyên khoa cần lọc
     * @return danh sách kết quả đã hoàn tất hôm nay
     */
    @Override
    public List<Map<String, Object>> getCompletedTestsToday(Integer maChuyenKhoa) {
        return repository.findCompletedTestsToday(maChuyenKhoa);
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
     *             và các trường tuỳ chọn (nhân viên thực hiện, template, ảnh, chỉ số)
     * @throws Exception khi thiếu thông tin bắt buộc hoặc không tìm thấy chi tiết chỉ định
     */
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

        // Xác định loại dịch vụ: CĐHA nếu thuộc CLS_CHAN_DOAN_HINH_ANH
        String templateKey = body.get("templateKey") != null ? body.get("templateKey").toString() : null;
        DichVu dv = dichVuRepository.findById(detail.getMaDichVu()).orElse(null);
        boolean isCdha = dv != null && "CLS_CHAN_DOAN_HINH_ANH".equals(dv.getLoaiDichVu());
        boolean isRadioTemplate = "ULTRASOUND".equals(templateKey) || "XRAY".equals(templateKey)
                || "CT_SCAN".equals(templateKey) || "CDHA_GENERIC".equals(templateKey);

        if (isCdha || isRadioTemplate) {
            // ── Xử lý kết quả Chẩn Đoán Hình Ảnh ──
            KetQuaCdha kqcdha = ketQuaCdhaRepository.findByIdChiTietChiDinh(detailId)
                    .orElse(new KetQuaCdha());

            kqcdha.setIdChiTietChiDinh(detailId);
            kqcdha.setNgayThucHien(LocalDateTime.now());
            kqcdha.setMaNhanVienThucHien(maNhanVienThucHien);

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
            KetQuaXetNghiem kqxn = ketQuaXetNghiemRepository.findByMaChiTietChiDinh(detailId)
                    .orElse(new KetQuaXetNghiem());

            kqxn.setMaChiTietChiDinh(detailId);
            kqxn.setNgayThucHien(LocalDateTime.now());
            kqxn.setNguoiThucHien(maNhanVienThucHien);
            // Lưu toàn bộ nội dung kết quả (chỉ số + biên bản) do KTV nhập vào cột ket_qua
            kqxn.setKetQua(ketQua);

            // Giữ nguyên các trường đã có nếu cập nhật lại (vd ghi_chu_them đã nhập trước)
            if (body.get("ghiChuThem") != null) kqxn.setGhiChuThem(body.get("ghiChuThem").toString());

            // Giữ nguyên trạng thái nếu kết quả đã được duyệt (chỉ cập nhật nội dung)
            if (!"DA_DUYET".equals(kqxn.getTrangThai())) {
                if (body.get("trangThai") != null) kqxn.setTrangThai(body.get("trangThai").toString());
                else kqxn.setTrangThai("CHO_DUYET");
            }

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
            }
            webSocketPublisher.publishClsChange("SUBMITTED", maPhieuKham, loai);
        }
    }

    /**
     * Lấy danh sách kết quả chờ duyệt theo chuyên khoa (dành cho bác sĩ chẩn đoán/xét nghiệm).
     *
     * @param maChuyenKhoa mã chuyên khoa cần lọc
     * @return danh sách kết quả đang chờ duyệt
     */
    @Override
    public List<Map<String, Object>> getPendingApprovalList(Integer maChuyenKhoa) {
        return repository.findPendingApprovalList(maChuyenKhoa);
    }

    /**
     * Lấy danh sách kết quả đã duyệt theo chuyên khoa (dành cho bác sĩ chẩn đoán/xét nghiệm).
     *
     * @param maChuyenKhoa mã chuyên khoa cần lọc
     * @return danh sách kết quả đã được duyệt
     */
    @Override
    public List<Map<String, Object>> getApprovedList(Integer maChuyenKhoa) {
        return repository.findApprovedList(maChuyenKhoa);
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
    @Transactional
    public PhieuChiDinh create(ReferralRequest request) throws Exception {
        PhieuChiDinh pk = request.getPhieuChiDinh();
        List<ChiTietChiDinh> details = request.getChiTietList();

        // Tránh trùng lặp: Tìm các phiếu chỉ định đã có cho phiếu khám này
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

        // Bắt buộc chọn phòng cho mọi dịch vụ CLS, giữ chỗ theo hạn mức phòng/ngày
        LocalDate today = TimeUtil.today();
        for (ChiTietChiDinh item : details) {
            if (item.getMaPhong() == null) {
                throw new IllegalArgumentException("Vui lòng chọn phòng cho tất cả dịch vụ");
            }
        }
        for (ChiTietChiDinh item : details) {
            hanMucPhongService.giuChoPhong(item.getMaPhong(), today);
        }

        if (pk.getNgayChiDinh() == null) pk.setNgayChiDinh(LocalDateTime.now());
        PhieuChiDinh savedPk = repository.save(pk);

        for (ChiTietChiDinh item : details) {
            item.setMaPhieuChiDinh(savedPk.getMaPhieuChiDinh());
            if (item.getTrangThaiDv() == null) item.setTrangThaiDv("CHUA_THUC_HIEN");

            // Đảm bảo donGia được lấy từ catalog nếu frontend gửi null hoặc 0
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
        KetQuaCdha kq = ketQuaCdhaRepository.findByIdChiTietChiDinh(detailId).orElse(null);
        if (kq != null) fillAnhCdha(kq);
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
        var kqOpt = ketQuaXetNghiemRepository.findByMaChiTietChiDinh(detailId);
        if (kqOpt.isPresent()) {
            KetQuaXetNghiem kq = kqOpt.get();
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
     * Tự động HOAN_THANH phiếu khám và đăng ký khám bệnh nếu dịch vụ TRONG PHIẾU KHÁM là CLS.
     * Chỉ áp dụng khi loai_dich_vu là 'CLS_XET_NGHIEM' hoặc 'CLS_CHAN_DOAN_HINH_ANH'.
     * Sử dụng HOAN_THANH để đồng bộ với finishConsultation() của bác sĩ.
     */
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

            // Cập nhật trạng thái HOAN_THANH vào bảng lich_kham thông qua DangKyKhamBenh
            dangKyKhamBenhRepository.findByMaPhieuKham(phieuKham.getMaPhieuKham()).ifPresent(dk -> {
                lichKhamRepository.findByMaDangKyKhamBenh(dk.getId()).ifPresent(lk -> {
                    lk.setTrangThai("HOAN_THANH");
                    lichKhamRepository.save(lk);
                });
            });
        }
    }

    /**
     * Duyệt kết quả xét nghiệm: cập nhật kết luận/bác sĩ kết luận, đặt trạng thái
     * {@code DA_DUYET} và hoàn tất phiếu khám nếu dịch vụ thuộc loại CLS.

     * Khi {@code updateOnly=true} chỉ cập nhật nội dung, giữ nguyên trạng thái
     * và không phát tín hiệu duyệt.
  
     *
     * @param id mã kết quả xét nghiệm
     * @param body dữ liệu duyệt gồm {@code ketLuan}, {@code maBsKetLuan}, {@code ghiChuThem},
     *             {@code ketQua} và cờ {@code updateOnly} tuỳ chọn
     * @throws Exception nếu không tìm thấy kết quả
     */
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

        // Nếu chỉ cập nhật nội dung (xem lại đã duyệt) thì giữ nguyên trạng thái
        if (!updateOnly) {
            kq.setTrangThai("DA_DUYET");
        }
        ketQuaXetNghiemRepository.save(kq);

        if (updateOnly) return;

        // Chỉ update maNhanVienChiDinh nếu dịch vụ trong phiếu khám là CLS
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

    /**
     * Lấy lịch sử các kết quả xét nghiệm đã duyệt của một bác sĩ.
     *
     * @param maBacSi mã bác sĩ
     * @return danh sách lịch sử kết quả đã duyệt
     */
    @Override
    public List<Map<String, Object>> getApprovedHistory(Integer maBacSi) {
        return ketQuaXetNghiemRepository.findApprovedHistoryDetailed(maBacSi);
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
     * @param body dữ liệu duyệt gồm mô tả, kết luận, đề nghị, bác sĩ thực hiện, ảnh
     *             và cờ {@code updateOnly} tuỳ chọn
     * @throws Exception nếu xảy ra lỗi nghiệp vụ khi duyệt
     */
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
        String anh1 = body.get("duongDanAnh1") != null ? body.get("duongDanAnh1").toString() : null;
        String anh2 = body.get("duongDanAnh2") != null ? body.get("duongDanAnh2").toString() : null;
        // Tương thích ngược: giữ trường tạm để response cũ vẫn có duongDanAnh1/2
        kq.setDuongDanAnh1(anh1);
        kq.setDuongDanAnh2(anh2);

        boolean updateOnly = body.get("updateOnly") != null && Boolean.parseBoolean(body.get("updateOnly").toString());

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

        // Chỉ update maNhanVienChiDinh nếu dịch vụ trong phiếu khám là CLS
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