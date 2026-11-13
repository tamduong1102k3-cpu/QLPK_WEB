package com.qlpk.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "phan_cong_tro_ly_bac_si",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_phan_cong_tro_ly_bac_si_pair",
                columnNames = {"id_phan_cong_bac_si", "id_phan_cong_tro_ly"}),
        indexes = {
                @Index(name = "idx_pctlbs_bac_si", columnList = "id_phan_cong_bac_si"),
                @Index(name = "idx_pctlbs_tro_ly", columnList = "id_phan_cong_tro_ly")
        })
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PhanCongTroLyBacSi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "id_phan_cong_bac_si", nullable = false)
    private Integer idPhanCongBacSi;

    @Column(name = "id_phan_cong_tro_ly", nullable = false)
    private Integer idPhanCongTroLy;

    @Column(name = "ngay_tao", nullable = false, updatable = false)
    private LocalDateTime ngayTao;
}
