package com.qlpk.backend.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalTime;

@Entity
@Table(name = "ca_lam")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CaLam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "ten_ca", length = 100, nullable = false)
    private String tenCa;

    @Column(name = "gio_bat_dau", nullable = false)
    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime gioBatDau;

    @Column(name = "gio_ket_thuc", nullable = false)
    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime gioKetThuc;

    @Column(name = "created_at", nullable = false, updatable = false)
    private java.time.LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private java.time.LocalDateTime updatedAt;

}
