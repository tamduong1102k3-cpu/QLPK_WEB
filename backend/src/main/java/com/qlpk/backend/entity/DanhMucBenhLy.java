package com.qlpk.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
@Table(name = "danh_muc_benh_ly")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class DanhMucBenhLy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "ma_icd", length = 20)
    private String maIcd;

    @Column(name = "ten_benh", length = 255)
    private String tenBenh;

    @Column(name = "trieu_chung_goi_y", columnDefinition = "TEXT")
    private String trieuChungGoiY;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "chuyen_khoa_lien_quan", referencedColumnName = "ma_chuyen_khoa")
    private ChuyenKhoa chuyenKhoaLienQuan;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getMaIcd() { return maIcd; }
    public void setMaIcd(String maIcd) { this.maIcd = maIcd; }

    public String getTenBenh() { return tenBenh; }
    public void setTenBenh(String tenBenh) { this.tenBenh = tenBenh; }

    public String getTrieuChungGoiY() { return trieuChungGoiY; }
    public void setTrieuChungGoiY(String trieuChungGoiY) { this.trieuChungGoiY = trieuChungGoiY; }

    public ChuyenKhoa getChuyenKhoaLienQuan() { return chuyenKhoaLienQuan; }
    public void setChuyenKhoaLienQuan(ChuyenKhoa chuyenKhoaLienQuan) { this.chuyenKhoaLienQuan = chuyenKhoaLienQuan; }
}
