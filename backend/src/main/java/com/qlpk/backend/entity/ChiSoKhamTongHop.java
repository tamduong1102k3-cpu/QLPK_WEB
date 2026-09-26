package com.qlpk.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "chi_so_kham_tong_hop")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChiSoKhamTongHop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "ma_phieu_kham")
    private Integer maPhieuKham;

    @Column(name = "ma_chuyen_khoa")
    private Integer maChuyenKhoa;

    @Column(name = "ma_nhan_vien_nhap")
    private Integer maNhanVienNhap;

    @Column(name = "nhiet_do")
    private Double nhietDo;

    @Column(name = "nhip_tim")
    private Integer nhipTim;

    @Column(name = "nhip_tho")
    private Integer nhipTho;

    @Column(name = "huyet_ap_tam_thu")
    private Integer huyetApTamThu;

    @Column(name = "huyet_ap_tam_truong")
    private Integer huyetApTamTruong;

    @Column(name = "can_nang")
    private Double canNang;

    @Column(name = "chieu_cao")
    private Double chieuCao;

    @Column(name = "spo2")
    private Double spo2;

    @Column(name = "vong_dau")
    private Double vongDau;

    @Column(name = "tinh_trang_dinh_duong", length = 100)
    private String tinhTrangDinhDuong;

    @Column(name = "tam_ly_hanh_vi", length = 100)
    private String tamLyHanhVi;

    @Column(name = "kham_tai_mui_hong_nhi", columnDefinition = "TEXT")
    private String khamTaiMuiHongNhi;

    @Column(name = "kham_ho_hap_nhi", columnDefinition = "TEXT")
    private String khamHoHapNhi;

    @Column(name = "kham_du_niem_mac_nhi", columnDefinition = "TEXT")
    private String khamDuNiemMacNhi;

    @Column(name = "co_quan_khac_nhi", columnDefinition = "TEXT")
    private String coQuanKhacNhi;

    @Column(name = "tinh_trang_rang", columnDefinition = "TEXT")
    private String tinhTrangRang;

    @Column(name = "sau_rang", length = 100)
    private String sauRang;

    @Column(name = "cao_rang", length = 50)
    private String caoRang;

    @Column(name = "viem_nuou", columnDefinition = "TEXT")
    private String viemNuou;

    @Column(name = "khop_can", length = 50)
    private String khopCan;

    @Column(name = "niem_mac_mieng", columnDefinition = "TEXT")
    private String niemMacMieng;

    @Column(name = "do_lung_lay", length = 50)
    private String doLungLay;

    @Column(name = "phu_hinh_cu", columnDefinition = "TEXT")
    private String phuHinhCu;

    @Column(name = "benh_ly_khac_rhm", columnDefinition = "TEXT")
    private String benhLyKhacRhm;

    @Column(name = "thinh_luc_tai_trai", length = 50)
    private String thinhLucTaiTrai;

    @Column(name = "thinh_luc_tai_phai", length = 50)
    private String thinhLucTaiPhai;

    @Column(name = "tinh_trang_mui", length = 50)
    private String tinhTrangMui;

    @Column(name = "tinh_trang_hong", length = 50)
    private String tinhTrangHong;

    @Column(name = "soi_tai_mui_hong", columnDefinition = "TEXT")
    private String soiTaiMuiHong;

    @Column(name = "ong_tai", columnDefinition = "TEXT")
    private String ongTai;

    @Column(name = "mang_nhi_phai", length = 255)
    private String mangNhiPhai;

    @Column(name = "mang_nhi_trai", length = 255)
    private String mangNhiTrai;

    @Column(name = "vach_ngan", length = 255)
    private String vachNgan;

    @Column(name = "cuon_mui", length = 255)
    private String cuonMui;

    @Column(name = "khe_mui", length = 255)
    private String kheMui;

    @Column(name = "amidan", length = 255)
    private String amidan;

    @Column(name = "thanh_quan", columnDefinition = "TEXT")
    private String thanhQuan;

    @Column(name = "cholesterol")
    private Double cholesterol;

    @Column(name = "hdl_cholesterol")
    private Double hdlCholesterol;

    @Column(name = "ldl_cholesterol")
    private Double ldlCholesterol;

    @Column(name = "triglyceride")
    private Double triglyceride;

    @Column(name = "duong_huyet")
    private Double duongHuyet;

    @Column(name = "ecg_ket_qua", columnDefinition = "TEXT")
    private String ecgKetQua;

    @Column(name = "sieu_am_tim", columnDefinition = "TEXT")
    private String sieuAmTim;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    @Column(name = "kham_da_niem_mac_nhi", columnDefinition = "TEXT")
    private String khamDaNiemMacNhi;

    @Column(name = "ngay_tao")
    private java.time.LocalDateTime ngayTao;

}
