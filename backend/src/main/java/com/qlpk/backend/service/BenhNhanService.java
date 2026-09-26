package com.qlpk.backend.service;

import com.qlpk.backend.dto.*;
import com.qlpk.backend.entity.*;
import java.util.List;
import java.util.Optional;

public interface BenhNhanService {
    List<BenhNhan> getAll();
    BenhNhan getById(Integer id);
    BenhNhan create(BenhNhan entity) throws Exception;
    BenhNhan update(Integer id, BenhNhan entity);
    void delete(Integer id);

    List<BenhNhan> search(String keyword);
    Optional<BenhNhan> findExactMatch(String hoTen, String soDienThoai, String cccd);
    Optional<BenhNhan> findByCccd(String cccd);
    List<BenhNhan> findFlexible(String hoTen, String soDienThoai, String cccd);
    List<HoSoBenhNhanDTO> getHoSo(Integer id);
    ChiTietCaKhamDTO getChiTietCaKham(Integer maPhieuKham);

    ChiTietCaKhamCoBanDTO getChiTietCaKhamCoBan(Integer maPhieuKham);
    KhamLamSang getKhamLamSangByMaPhieuKham(Integer maPhieuKham);
    ChiSoKhamTongHop getChiSoKhamTongHopByMaPhieuKham(Integer maPhieuKham);
    List<ChiSoKhamTongHop> getAllChiSoKhamTongHopByMaPhieuKham(Integer maPhieuKham);
    CaKhamHoaDonDTO getHoaDonByMaPhieuKham(Integer maPhieuKham);
    List<LichKham> getLichTaiKhamByMaPhieuKham(Integer maPhieuKham);
    TiepNhanCls getTiepNhanClsByMaPhieuKham(Integer maPhieuKham);
    List<PhieuChiDinhChiTietDTO> getPhieuChiDinhByMaPhieuKham(Integer maPhieuKham);
    List<ToaThuocChiTietDTO> getToaThuocByMaPhieuKham(Integer maPhieuKham);
    List<PhieuKhamDTO> getPhieuKhamListByBenhNhan(Integer maBenhNhan);
    List<PhieuKhamDTO> getPhieuKhamListByBenhNhanAllStatus(Integer maBenhNhan);
    List<ToaThuocChiTietDTO> getToaThuocByMaBenhNhan(Integer maBenhNhan);
    List<HoaDonBenhNhanDTO> getHoaDonListByBenhNhan(Integer maBenhNhan);
}
