package com.qlpk.backend.dto;

import com.qlpk.backend.entity.NhanVien;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Bản rút gọn của NhanVien — dùng cho endpoint public (guest xem bác sĩ).
 * KHÔNG chứa field nhạy cảm: cccd, soDienThoai, diaChi, email, ngaySinh, ngayVaoLam.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NhanVienPublicDTO {
    private Integer maNhanVien;
    private String hoTen;
    private Integer gioiTinh;
    private Integer chuyenKhoa;
    private String bangCap;
    private String chucVu;

    public static NhanVienPublicDTO fromEntity(NhanVien nv) {
        if (nv == null) return null;
        NhanVienPublicDTO dto = new NhanVienPublicDTO();
        dto.setMaNhanVien(nv.getMaNhanVien());
        dto.setHoTen(nv.getHoTen());
        dto.setGioiTinh(nv.getGioiTinh());
        dto.setChuyenKhoa(nv.getChuyenKhoa());
        dto.setBangCap(nv.getBangCap());
        dto.setChucVu(nv.getChucVu());
        return dto;
    }
}
