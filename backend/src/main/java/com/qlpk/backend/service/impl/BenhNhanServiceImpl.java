package com.qlpk.backend.service.impl;

import com.qlpk.backend.dto.*;
import com.qlpk.backend.entity.*;
import com.qlpk.backend.repository.*;
import com.qlpk.backend.service.BenhNhanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class BenhNhanServiceImpl implements BenhNhanService {

    @Autowired private BenhNhanRepository repository;
    @Autowired private PhieuKhamRepository phieuKhamRepository;
    @Autowired private HoaDonRepository hoaDonRepository;
    @Autowired private NhanVienRepository nhanVienRepository;
    @Autowired private ChuyenKhoaRepository chuyenKhoaRepository;
    @Autowired private KhamLamSangRepository khamLamSangRepository;
    @Autowired private PhieuChiDinhRepository phieuChiDinhRepository;
    @Autowired private ChiTietChiDinhRepository chiTietChiDinhRepository;
    @Autowired private KetQuaXetNghiemRepository ketQuaXetNghiemRepository;
    @Autowired private KetQuaCdhaRepository ketQuaCdhaRepository;
    @Autowired private ToaThuocRepository toaThuocRepository;
    @Autowired private ChiTietToaThuocRepository chiTietToaThuocRepository;
    @Autowired private DichVuRepository dichVuRepository;
    @Autowired private ThuocRepository thuocRepository;
    @Autowired private ChiSoKhamTongHopRepository chiSoKhamTongHopRepository;
    @Autowired private ChiTietHoaDonRepository chiTietHoaDonRepository;
    @Autowired private LichKhamRepository lichKhamRepository;
    @Autowired private TiepNhanClsRepository tiepNhanClsRepository;
    @Autowired private ChiTietKetQuaXnRepository chiTietKetQuaXnRepository;
    @Autowired private ChiTietXetNghiemRepository chiTietXetNghiemRepository;

    @Override
    public List<BenhNhan> getAll() {
        return repository.findAll();
    }

    @Override
    public BenhNhan getById(Integer id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public BenhNhan create(BenhNhan entity) throws Exception {

        String hoTen = entity.getHoTen() != null ? entity.getHoTen().trim() : null;
        String soDienThoai = entity.getSoDienThoai() != null ? entity.getSoDienThoai().trim() : null;
        String cccd = entity.getCccd() != null ? entity.getCccd().trim() : null;
        String email = entity.getEmail() != null ? entity.getEmail().trim() : null;
        String diaChi = entity.getDiaChi() != null ? entity.getDiaChi().trim() : null;
        String tienSuBenh = entity.getTienSuBenh() != null ? entity.getTienSuBenh().trim() : null;

        if (hoTen == null || hoTen.isBlank()) {
            throw new Exception("Vui lòng nhập họ và tên");
        }
        if (hoTen.length() < 2) {
            throw new Exception("Họ tên quá ngắn");
        }
        if (hoTen.length() > 30) {
            throw new Exception("Họ tên tối đa 30 ký tự");
        }
        entity.setHoTen(hoTen);

        if (soDienThoai == null || soDienThoai.isBlank()) {
            throw new Exception("Vui lòng nhập số điện thoại");
        }
        if (!soDienThoai.matches("^(0|\\+84)[0-9]{9,10}$")) {
            throw new Exception("Số điện thoại không hợp lệ (VD: 0912345678)");
        }
        entity.setSoDienThoai(soDienThoai);
        if (repository.existsBySoDienThoai(soDienThoai)) {
            throw new Exception("Số điện thoại này đã được đăng ký cho bệnh nhân khác");
        }

        if (cccd == null || cccd.isBlank()) {
            throw new Exception("Vui lòng nhập CCCD/CMND");
        }
        if (!cccd.matches("^\\d{9}$|^\\d{12}$")) {
            throw new Exception("CCCD/CMND phải gồm 9 hoặc 12 chữ số");
        }
        entity.setCccd(cccd);
        if (repository.existsByCccd(cccd)) {
            throw new Exception("Số CCCD này đã tồn tại trong hệ thống");
        }

        if (email == null || email.isBlank()) {
            throw new Exception("Vui lòng nhập email");
        }
        if (!email.matches("^[\\w\\.\\-]+@([\\w\\-]+\\.)+[a-zA-Z]{2,}$")) {
            throw new Exception("Email không đúng định dạng");
        }
        entity.setEmail(email);
        if (repository.existsByEmail(email)) {
            throw new Exception("Email này đã được sử dụng");
        }

        if (diaChi == null || diaChi.isBlank()) {
            throw new Exception("Vui lòng nhập địa chỉ");
        }
        if (diaChi.length() < 5) {
            throw new Exception("Địa chỉ quá ngắn");
        }
        if (diaChi.length() > 255) {
            throw new Exception("Địa chỉ tối đa 255 ký tự");
        }
        entity.setDiaChi(diaChi);

        if (entity.getNgaySinh() == null) {
            throw new Exception("Vui lòng nhập ngày sinh");
        }
        if (entity.getNgaySinh().isAfter(java.time.LocalDate.now())) {
            throw new Exception("Ngày sinh không được ở tương lai");
        }

        if (entity.getGioiTinh() == null) {
            throw new Exception("Vui lòng chọn giới tính");
        }

        if (tienSuBenh == null || tienSuBenh.isBlank()) {
            throw new Exception("Vui lòng nhập tiền sử bệnh");
        }
        if (tienSuBenh.length() > 255) {
            throw new Exception("Tiền sử bệnh tối đa 255 ký tự");
        }
        entity.setTienSuBenh(tienSuBenh);

        if (entity.getDaXacMinhDanhTinh() == null) {
            entity.setDaXacMinhDanhTinh(true);
        }

        return repository.save(entity);
    }

    @Override
    public BenhNhan update(Integer id, BenhNhan body) {
        return repository.findById(id).map(existing -> {

            String hoTen = body.getHoTen() != null ? body.getHoTen().trim() : null;
            String soDienThoai = body.getSoDienThoai() != null ? body.getSoDienThoai().trim() : null;
            String cccd = body.getCccd() != null ? body.getCccd().trim() : null;
            String email = body.getEmail() != null ? body.getEmail().trim() : null;
            String diaChi = body.getDiaChi() != null ? body.getDiaChi().trim() : null;
            String tienSuBenh = body.getTienSuBenh() != null ? body.getTienSuBenh().trim() : null;

            if (hoTen == null || hoTen.isBlank()) {
                throw new IllegalArgumentException("Vui lòng nhập họ và tên");
            }
            if (hoTen.length() < 2) {
                throw new IllegalArgumentException("Họ tên quá ngắn");
            }
            if (hoTen.length() > 30) {
                throw new IllegalArgumentException("Họ tên tối đa 30 ký tự");
            }

            if (soDienThoai == null || soDienThoai.isBlank()) {
                throw new IllegalArgumentException("Vui lòng nhập số điện thoại");
            }
            if (!soDienThoai.matches("^(0|\\+84)[0-9]{9,10}$")) {
                throw new IllegalArgumentException("Số điện thoại không hợp lệ (VD: 0912345678)");
            }

            if (cccd == null || cccd.isBlank()) {
                throw new IllegalArgumentException("Vui lòng nhập CCCD/CMND");
            }
            if (!cccd.matches("^\\d{9}$|^\\d{12}$")) {
                throw new IllegalArgumentException("CCCD/CMND phải gồm 9 hoặc 12 chữ số");
            }

            if (email == null || email.isBlank()) {
                throw new IllegalArgumentException("Vui lòng nhập email");
            }
            if (!email.matches("^[\\w\\.\\-]+@([\\w\\-]+\\.)+[a-zA-Z]{2,}$")) {
                throw new IllegalArgumentException("Email không đúng định dạng");
            }

            if (diaChi == null || diaChi.isBlank()) {
                throw new IllegalArgumentException("Vui lòng nhập địa chỉ");
            }
            if (diaChi.length() < 5) {
                throw new IllegalArgumentException("Địa chỉ quá ngắn");
            }
            if (diaChi.length() > 255) {
                throw new IllegalArgumentException("Địa chỉ tối đa 255 ký tự");
            }

            if (body.getNgaySinh() == null) {
                throw new IllegalArgumentException("Vui lòng nhập ngày sinh");
            }
            if (body.getNgaySinh().isAfter(java.time.LocalDate.now())) {
                throw new IllegalArgumentException("Ngày sinh không được ở tương lai");
            }

            if (body.getGioiTinh() == null) {
                throw new IllegalArgumentException("Vui lòng chọn giới tính");
            }

            if (tienSuBenh == null || tienSuBenh.isBlank()) {
                throw new IllegalArgumentException("Vui lòng nhập tiền sử bệnh");
            }
            if (tienSuBenh.length() > 255) {
                throw new IllegalArgumentException("Tiền sử bệnh tối đa 255 ký tự");
            }

            existing.setHoTen(hoTen);
            existing.setNgaySinh(body.getNgaySinh());
            existing.setDiaChi(diaChi);
            existing.setSoDienThoai(soDienThoai);
            existing.setEmail(email);
            existing.setNgheNghiep(body.getNgheNghiep());
            existing.setNhomMau(body.getNhomMau());
            existing.setDiUngThuoc(body.getDiUngThuoc());
            existing.setTienSuBenh(tienSuBenh);
            existing.setNguoiGiamHo(body.getNguoiGiamHo());
            existing.setSoDienThoaiNguoiGiamHo(body.getSoDienThoaiNguoiGiamHo());
            existing.setGhiChu(body.getGhiChu());
            existing.setCccd(cccd);
            existing.setGioiTinh(body.getGioiTinh());
            return repository.save(existing);
        }).orElse(null);
    }

    @Override
    public void delete(Integer id) {
        repository.deleteById(id);
    }

    @Override
    public List<BenhNhan> search(String keyword) {
        if (keyword == null || keyword.isBlank()) return repository.findAll();
        return repository.search(keyword);
    }

    @Override
    public Optional<BenhNhan> findExactMatch(String hoTen, String soDienThoai, String cccd) {
        return repository.findExactMatch(hoTen, soDienThoai, cccd);
    }

    @Override
    public Optional<BenhNhan> findByCccd(String cccd) {
        if (cccd == null || cccd.isBlank()) return Optional.empty();
        return repository.findByCccd(cccd);
    }

    @Override
    public List<BenhNhan> findFlexible(String hoTen, String soDienThoai, String cccd) {
        if (cccd != null && !cccd.isBlank()) {
            Optional<BenhNhan> result = repository.findByCccd(cccd.trim());
            if (result.isPresent()) {
                return List.of(result.get());
            }
        }
        String finalHoTen = hoTen != null && !hoTen.isBlank() ? hoTen.trim() : null;
        String finalSoDienThoai = soDienThoai != null && !soDienThoai.isBlank() ? soDienThoai.trim() : null;
        String finalCccd = cccd != null && !cccd.isBlank() ? cccd.trim() : null;
        if (finalHoTen == null && finalSoDienThoai == null && finalCccd == null) {
            return List.of();
        }
        return repository.findFlexible(finalHoTen, finalSoDienThoai, finalCccd);
    }

    @Override
    public List<HoSoBenhNhanDTO> getHoSo(Integer id) {
        List<PhieuKham> phieuKhams = phieuKhamRepository.findByMaBenhNhanAndTrangThaiHoanThanh(id);
        Map<Integer, String> nvMap = nhanVienRepository.findAll()
                .stream().collect(Collectors.toMap(NhanVien::getMaNhanVien, NhanVien::getHoTen, (a, b) -> a));
        Map<Integer, String> ckMap = chuyenKhoaRepository.findAll()
                .stream().collect(Collectors.toMap(ChuyenKhoa::getMaChuyenKhoa, ChuyenKhoa::getTenChuyenKhoa, (a, b) -> a));
        Map<Integer, String> dvMap = dichVuRepository.findAll()
                .stream().collect(Collectors.toMap(DichVu::getMaDichVu, DichVu::getTenDichVu, (a, b) -> a));
        List<HoSoBenhNhanDTO> result = new ArrayList<>();
        for (PhieuKham pk : phieuKhams) {
            List<HoaDon> hoaDons = hoaDonRepository.findByMaPhieuKham(pk.getMaPhieuKham());
            HoaDon hoaDon = hoaDons.stream()
                    .filter(h -> "da thanh toan".equalsIgnoreCase(h.getTrangThai()))
                    .findFirst()
                    .orElse(hoaDons.isEmpty() ? null : hoaDons.get(0));
            HoSoBenhNhanDTO dto = new HoSoBenhNhanDTO();
            dto.setMaPhieuKham(pk.getMaPhieuKham());
            dto.setNgayKham(pk.getNgayKham());
            dto.setTrangThaiKham(pk.getTrangThai());
            dto.setGhiChuKham(pk.getGhiChu());
            dto.setTenChuyenKhoa(pk.getMaChuyenKhoa() != null ? ckMap.getOrDefault(pk.getMaChuyenKhoa(), "—") : "—");
            dto.setTenNhanVien(pk.getMaNhanVien() != null ? nvMap.getOrDefault(pk.getMaNhanVien(), "—") : "—");
            dto.setTenDichVu(pk.getMaDichVu() != null ? dvMap.getOrDefault(pk.getMaDichVu(), "—") : "—");
            khamLamSangRepository.findByMaPhieuKham(pk.getMaPhieuKham()).ifPresent(kls -> {
                dto.setLyDoKham(kls.getLyDoKham());
                dto.setTienSuBanThan(kls.getTienSuBanThan());
                dto.setBenhSu(kls.getBenhSu());
                dto.setChanDoanSoBo(kls.getChanDoanSoBo());
                dto.setLoiDanBacSi(kls.getLoiDanBacSi());
                dto.setKetQuaCLS(kls.getKetQuaKhamCanLamSang());
                dto.setKhamLamSang(kls.getKhamLamSang());
            });
            if (hoaDon != null) {
                dto.setMaHoaDon(hoaDon.getMaHoaDon());
                dto.setTongTien(hoaDon.getTongTien());
                dto.setNgayThanhToan(hoaDon.getNgayThanhToan());
                dto.setTrangThaiHoaDon(hoaDon.getTrangThai());
                dto.setGhiChuHoaDon(hoaDon.getGhiChu());
            }
            result.add(dto);
        }
        return result;
    }

    @Override
    public ChiTietCaKhamDTO getChiTietCaKham(Integer maPhieuKham) {

        ChiTietCaKhamCoBanDTO coBan =
                getChiTietCaKhamCoBan(maPhieuKham);

        if (coBan == null) {
            return null;
        }

        ChiTietCaKhamDTO dto = new ChiTietCaKhamDTO();

        dto.setPhieuKham(coBan.getPhieuKham());
        dto.setBenhNhan(coBan.getBenhNhan());
        dto.setTenChuyenKhoa(coBan.getTenChuyenKhoa());
        dto.setTenNhanVien(coBan.getTenNhanVien());

        dto.setKhamLamSang(
                getKhamLamSangByMaPhieuKham(maPhieuKham)
        );

        dto.setChiSoKhamTongHop(
                getChiSoKhamTongHopByMaPhieuKham(maPhieuKham)
        );

        CaKhamHoaDonDTO hoaDonDTO =
                getHoaDonByMaPhieuKham(maPhieuKham);

        if (hoaDonDTO != null) {
            dto.setHoaDon(hoaDonDTO.getHoaDon());
            dto.setChiTietHoaDon(hoaDonDTO.getChiTietHoaDon());
        }

        dto.setLichTaiKham(
                getLichTaiKhamByMaPhieuKham(maPhieuKham)
        );

        dto.setTiepNhanCls(
                getTiepNhanClsByMaPhieuKham(maPhieuKham)
        );

        dto.setDanhSachPhieuChiDinh(
                getPhieuChiDinhByMaPhieuKham(maPhieuKham)
        );

        dto.setDanhSachToaThuoc(
                getToaThuocByMaPhieuKham(maPhieuKham)
        );

        return dto;
    }

    @Override
    public ChiTietCaKhamCoBanDTO getChiTietCaKhamCoBan(Integer maPhieuKham) {
        PhieuKham phieuKham = phieuKhamRepository.findById(maPhieuKham).orElse(null);
        if (phieuKham == null) return null;
        ChiTietCaKhamCoBanDTO dto = new ChiTietCaKhamCoBanDTO();
        dto.setPhieuKham(phieuKham);
        BenhNhan benhNhan = repository.findById(phieuKham.getMaBenhNhan()).orElse(null);
        dto.setBenhNhan(benhNhan);
        if (phieuKham.getMaChuyenKhoa() != null) {
            chuyenKhoaRepository.findById(phieuKham.getMaChuyenKhoa())
                .ifPresent(ck -> dto.setTenChuyenKhoa(ck.getTenChuyenKhoa()));
        }
        if (phieuKham.getMaNhanVien() != null) {
            nhanVienRepository.findById(phieuKham.getMaNhanVien())
                .ifPresent(nv -> dto.setTenNhanVien(nv.getHoTen()));
        }
        if (phieuKham.getMaDichVu() != null) {
            dichVuRepository.findById(phieuKham.getMaDichVu()).ifPresent(dv -> {
                dto.setTenDichVu(dv.getTenDichVu());
                dto.setLoaiDichVu(dv.getLoaiDichVu());
            });
        }
        return dto;
    }

    @Override
    public KhamLamSang getKhamLamSangByMaPhieuKham(Integer maPhieuKham) {
        return khamLamSangRepository.findByMaPhieuKham(maPhieuKham).orElse(null);
    }

    @Override
    public ChiSoKhamTongHop getChiSoKhamTongHopByMaPhieuKham(Integer maPhieuKham) {
        return chiSoKhamTongHopRepository.findTopByMaPhieuKhamOrderByNgayTaoDesc(maPhieuKham).orElse(null);
    }

    @Override
    public List<ChiSoKhamTongHop> getAllChiSoKhamTongHopByMaPhieuKham(Integer maPhieuKham) {
        return chiSoKhamTongHopRepository.findAllByMaPhieuKhamOrderByNgayTaoDesc(maPhieuKham);
    }

    @Override
    public CaKhamHoaDonDTO getHoaDonByMaPhieuKham(Integer maPhieuKham) {
        List<HoaDon> hoaDons = hoaDonRepository.findByMaPhieuKham(maPhieuKham);
        HoaDon hoaDon = hoaDons.stream()
                .filter(h -> "da thanh toan".equalsIgnoreCase(h.getTrangThai()))
                .findFirst()
                .orElse(null);
        if (hoaDon == null) return null;
        CaKhamHoaDonDTO dto = new CaKhamHoaDonDTO();
        dto.setHoaDon(hoaDon);
        dto.setChiTietHoaDon(chiTietHoaDonRepository.findByMaHoaDon(hoaDon.getMaHoaDon()));
        return dto;
    }

    @Override
    public TiepNhanCls getTiepNhanClsByMaPhieuKham(Integer maPhieuKham) {
        List<TiepNhanCls> list = tiepNhanClsRepository.findByMaPhieuKham(maPhieuKham);
        return list.isEmpty() ? null : list.get(0);
    }

    @Override
    public List<LichKham> getLichTaiKhamByMaPhieuKham(Integer maPhieuKham) {

        Optional<PhieuKham> phieuKhamOpt = phieuKhamRepository.findById(maPhieuKham);
        if (phieuKhamOpt.isEmpty() || phieuKhamOpt.get().getMaLichKham() == null) {
            return List.of();
        }

        Integer maLichKham = phieuKhamOpt.get().getMaLichKham();

        Optional<LichKham> lichKhamOpt = lichKhamRepository.findById(maLichKham);
        if (lichKhamOpt.isEmpty()) {
            return List.of();
        }
        return List.of(lichKhamOpt.get());
    }

    @Override
    public List<PhieuChiDinhChiTietDTO> getPhieuChiDinhByMaPhieuKham(Integer maPhieuKham) {
        List<PhieuChiDinh> phieuChiDinhList = phieuChiDinhRepository.findByMaPhieuKham(maPhieuKham);
        List<PhieuChiDinhChiTietDTO> danhSachPhieuChiDinh = new ArrayList<>();
        for (PhieuChiDinh pcd : phieuChiDinhList) {
            PhieuChiDinhChiTietDTO pcdDto = new PhieuChiDinhChiTietDTO();
            pcdDto.setPhieuChiDinh(pcd);
            List<ChiTietChiDinh> chiTietList = chiTietChiDinhRepository.findByMaPhieuChiDinh(pcd.getMaPhieuChiDinh());
            List<ChiTietDichVuDTO> chiTietDichVuList = new ArrayList<>();
            for (ChiTietChiDinh ct : chiTietList) {
                ChiTietDichVuDTO ctDto = new ChiTietDichVuDTO();
                ctDto.setChiTietChiDinh(ct);
                if (ct.getMaDichVu() != null) {
                    dichVuRepository.findById(ct.getMaDichVu()).ifPresent(dv -> ctDto.setDichVu(dv));
                }
                enrichChiTietDichVu(ctDto, ct);
                chiTietDichVuList.add(ctDto);
            }
            pcdDto.setChiTietDichVu(chiTietDichVuList);
            danhSachPhieuChiDinh.add(pcdDto);
        }
        return danhSachPhieuChiDinh;
    }

    @Override
    public List<PhieuKhamDTO> getPhieuKhamListByBenhNhan(Integer maBenhNhan) {
        List<PhieuKham> phieuKhamList = phieuKhamRepository.findByMaBenhNhanAndTrangThaiHoanThanh(maBenhNhan);
        return mapPhieuKhamList(phieuKhamList);
    }

    @Override
    public List<PhieuKhamDTO> getPhieuKhamListByBenhNhanAllStatus(Integer maBenhNhan) {
        List<PhieuKham> phieuKhamList = phieuKhamRepository.findByMaBenhNhan(maBenhNhan);
        return mapPhieuKhamList(phieuKhamList);
    }

    private List<PhieuKhamDTO> mapPhieuKhamList(List<PhieuKham> phieuKhamList) {
        Map<Integer, String> nvMap = nhanVienRepository.findAll()
                .stream().collect(Collectors.toMap(NhanVien::getMaNhanVien, NhanVien::getHoTen, (a, b) -> a));
        Map<Integer, String> ckMap = chuyenKhoaRepository.findAll()
                .stream().collect(Collectors.toMap(ChuyenKhoa::getMaChuyenKhoa, ChuyenKhoa::getTenChuyenKhoa, (a, b) -> a));
        Map<Integer, String> dvMap = dichVuRepository.findAll()
                .stream().collect(Collectors.toMap(DichVu::getMaDichVu, DichVu::getTenDichVu, (a, b) -> a));
        Map<Integer, String> dvLoaiMap = dichVuRepository.findAll()
                .stream().collect(Collectors.toMap(DichVu::getMaDichVu, DichVu::getLoaiDichVu, (a, b) -> a));
        return phieuKhamList.stream().map(pk -> {
            PhieuKhamDTO dto = new PhieuKhamDTO();
            dto.setMaPhieuKham(pk.getMaPhieuKham());
            dto.setNgayKham(pk.getNgayKham());
            dto.setTrangThai(pk.getTrangThai());
            dto.setGhiChu(pk.getGhiChu());
            dto.setMaChuyenKhoa(pk.getMaChuyenKhoa());
            dto.setTenChuyenKhoa(pk.getMaChuyenKhoa() != null ? ckMap.getOrDefault(pk.getMaChuyenKhoa(), "—") : "—");
            dto.setTenNhanVien(pk.getMaNhanVien() != null ? nvMap.getOrDefault(pk.getMaNhanVien(), "—") : "—");
            dto.setTenDichVu(pk.getMaDichVu() != null ? dvMap.getOrDefault(pk.getMaDichVu(), "—") : "—");
            dto.setMaDichVu(pk.getMaDichVu());
            dto.setLoaiDichVu(pk.getMaDichVu() != null ? dvLoaiMap.get(pk.getMaDichVu()) : null);
            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    public List<HoaDonBenhNhanDTO> getHoaDonListByBenhNhan(Integer maBenhNhan) {
        List<Map<String, Object>> rows = hoaDonRepository.findPaidInvoicesByBenhNhan(maBenhNhan);
        List<HoaDonBenhNhanDTO> result = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            HoaDonBenhNhanDTO dto = new HoaDonBenhNhanDTO();
            dto.setMaHoaDon((Integer) row.get("maHoaDon"));
            dto.setMaPhieuKham((Integer) row.get("maPhieuKham"));
            dto.setTongTien((java.math.BigDecimal) row.get("tongTien"));
            dto.setNgayThanhToan(toLocalDateTime(row.get("ngayThanhToan")));
            dto.setTrangThai((String) row.get("trangThai"));
            dto.setPhuongThucThanhToan((String) row.get("phuongThucThanhToan"));
            dto.setMaGiaoDich((String) row.get("maGiaoDich"));
            dto.setGhiChu((String) row.get("ghiChu"));
            dto.setNgayKham(toLocalDateTime(row.get("ngayKham")));
            dto.setTenChuyenKhoa((String) row.get("tenChuyenKhoa"));
            dto.setTenNhanVien((String) row.get("tenNhanVien"));
            dto.setTenDichVu((String) row.get("tenDichVu"));
            result.add(dto);
        }
        return result;
    }

    private void enrichChiTietDichVu(ChiTietDichVuDTO ctDto, ChiTietChiDinh ct) {

        ketQuaXetNghiemRepository.findByMaChiTietChiDinh(ct.getId()).ifPresent(kq -> {
            ctDto.setKetQuaXetNghiem(kq);
            if (kq.getMaBsKetLuan() != null) {
                nhanVienRepository.findById(kq.getMaBsKetLuan())
                        .ifPresent(nv -> ctDto.setTenBsKetLuan(nv.getHoTen()));
            }
            if (kq.getNguoiThucHien() != null) {
                nhanVienRepository.findById(kq.getNguoiThucHien())
                        .ifPresent(nv -> ctDto.setTenKyThuatVien(nv.getHoTen()));
            }

            List<Map<String, Object>> chiSoList = new ArrayList<>();
            for (ChiTietKetQuaXn ctkq : chiTietKetQuaXnRepository.findByMaKetQuaXn(kq.getId())) {
                Map<String, Object> m = new java.util.HashMap<>();
                m.put("maChiSo", ctkq.getMaChiSo());
                m.put("giaTri", ctkq.getGiaTri());
                m.put("ghiChu", ctkq.getGhiChu());
                chiTietXetNghiemRepository.findById(ctkq.getMaChiSo()).ifPresent(cs -> {
                    m.put("tenChiSo", cs.getTenChiSo());
                    m.put("donVi", cs.getDonVi());
                    m.put("giaTriBinhThuong", cs.getGiaTriBinhThuong());
                    m.put("thuTu", cs.getThuTu());
                });
                chiSoList.add(m);
            }
            ctDto.setChiSoXetNghiem(chiSoList);
        });

        ketQuaCdhaRepository.findByIdChiTietChiDinh(ct.getId()).ifPresent(kq -> {
            ctDto.setKetQuaCdha(kq);
            if (kq.getMaBacSiThucHien() != null) {
                nhanVienRepository.findById(kq.getMaBacSiThucHien())
                        .ifPresent(nv -> ctDto.setTenBsCdha(nv.getHoTen()));
            }
            if (kq.getMaNhanVienThucHien() != null) {
                nhanVienRepository.findById(kq.getMaNhanVienThucHien())
                        .ifPresent(nv -> ctDto.setTenKyThuatVien(nv.getHoTen()));
            }
        });
    }

    private java.time.LocalDateTime toLocalDateTime(Object value) {
        if (value == null) return null;
        if (value instanceof java.time.LocalDateTime) {
            return (java.time.LocalDateTime) value;
        }
        if (value instanceof java.sql.Timestamp) {
            return ((java.sql.Timestamp) value).toLocalDateTime();
        }
        if (value instanceof java.sql.Date) {
            return ((java.sql.Date) value).toLocalDate().atStartOfDay();
        }
        if (value instanceof java.util.Date) {
            return java.time.LocalDateTime.ofInstant(
                    ((java.util.Date) value).toInstant(),
                    java.time.ZoneId.systemDefault());
        }
        return null;
    }

    @Override
    public List<ToaThuocChiTietDTO> getToaThuocByMaBenhNhan(Integer maBenhNhan) {
        List<ToaThuoc> toaThuocList = toaThuocRepository.findByMaBenhNhan(maBenhNhan);
        return mapToaThuocList(toaThuocList);
    }

    @Override
    public List<ToaThuocChiTietDTO> getToaThuocByMaPhieuKham(Integer maPhieuKham) {
        List<ToaThuoc> toaThuocList = toaThuocRepository.findActiveByMaPhieuKham(maPhieuKham);
        return mapToaThuocList(toaThuocList);
    }

    private List<ToaThuocChiTietDTO> mapToaThuocList(List<ToaThuoc> toaThuocList) {
        List<ToaThuocChiTietDTO> danhSachToaThuoc = new ArrayList<>();
        for (ToaThuoc tt : toaThuocList) {
            ToaThuocChiTietDTO ttDto = new ToaThuocChiTietDTO();
            ttDto.setToaThuoc(tt);
            List<ChiTietToaThuoc> chiTietThuocList = chiTietToaThuocRepository.findByMaToaThuoc(tt.getMaToaThuoc());
            List<ChiTietThuocDTO> chiTietThuocDtoList = new ArrayList<>();
            for (ChiTietToaThuoc ct : chiTietThuocList) {
                ChiTietThuocDTO ctDto = new ChiTietThuocDTO();
                ctDto.setChiTietToaThuoc(ct);
                if (ct.getMaThuoc() != null) {
                    thuocRepository.findById(ct.getMaThuoc()).ifPresent(t -> ctDto.setThuoc(t));
                }
                chiTietThuocDtoList.add(ctDto);
            }
            ttDto.setChiTietThuoc(chiTietThuocDtoList);
            danhSachToaThuoc.add(ttDto);
        }
        return danhSachToaThuoc;
    }
}
