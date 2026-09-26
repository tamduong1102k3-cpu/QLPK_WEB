package com.qlpk.backend.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalTime;

@Entity
@Table(
    name = "bang_phan_cong_ca_lam",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_nhan_vien_ca_ngay", columnNames = {"ma_nhan_vien", "ngay", "ma_ca"})
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BangPhanCongCaLam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "ma_nhan_vien", nullable = false)
    private Integer maNhanVien;

    @Column(name = "ngay")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private java.time.LocalDate ngay;

    @Column(name = "thu", length = 20)
    private String thu;

    @ManyToOne
    @JoinColumn(name = "ma_ca", referencedColumnName = "id")
    private CaLam ca;

    @Column(name = "phong")
    private Integer phong;

    @Transient
    private String tenPhong;

    @Enumerated(EnumType.STRING)
    @Column(name = "kieu_phan_cong")
    private KieuPhanCong kieuPhanCong;

    @Enumerated(EnumType.STRING)
    @Column(name = "hanh_dong")
    private HanhDongCaLam hanhDong;

    @Column(name = "ly_do", length = 255)
    private String lyDo;

    @Transient
    private Integer maCa;
}
