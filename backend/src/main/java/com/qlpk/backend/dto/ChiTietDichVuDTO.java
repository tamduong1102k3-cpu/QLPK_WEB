package com.qlpk.backend.dto;

import com.qlpk.backend.entity.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChiTietDichVuDTO {
    private ChiTietChiDinh chiTietChiDinh;
    private DichVu dichVu;
    private KetQuaXetNghiem ketQuaXetNghiem;
    private KetQuaCdha ketQuaCdha;
    // Tên bác sĩ kết luận xét nghiệm (tra từ ma_bs_ket_luan)
    private String tenBsKetLuan;
    // Tên bác sĩ thực hiện chẩn đoán hình ảnh (tra từ ma_bac_si_thuc_hien)
    private String tenBsCdha;
    // Tên kỹ thuật viên thực hiện (tra từ nguoi_thuc_hien / ma_nhan_vien_thuc_hien)
    private String tenKyThuatVien;
    // Danh sách chỉ số xét nghiệm (chi_tiet_ket_qua_xn join chi_so_xet_nghiem)
    private List<Map<String, Object>> chiSoXetNghiem;
}