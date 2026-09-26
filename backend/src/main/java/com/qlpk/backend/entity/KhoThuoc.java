package com.qlpk.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "kho_thuoc")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class KhoThuoc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_kho")
    private Integer idKho;

    @Column(name = "ma_thuoc")
    private Integer maThuoc;

    @Column(name = "so_luong_ton")
    private Integer soLuongTon;

    @Column(name = "ngay_cap_nhat_cuoi")
    private LocalDateTime ngayCapNhatCuoi;
    @Column(name = "so_luong_da_giu", nullable = false)
private Integer soLuongDaGiu = 0;
}
