package com.qlpk.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "vai_tro")
public class VaiTro {
    @Id
    @Column(name = "ma_vai_tro", length = 100)
    private String maVaiTro;

    @Column(name = "ten_bien_the", length = 50) 
    private String tenBienThe;

    // Getters and Setters
    public String getMaVaiTro() { return maVaiTro; }
    public void setMaVaiTro(String maVaiTro) { this.maVaiTro = maVaiTro; }

    public String getTenBienThe() { return tenBienThe; }
    public void setTenBienThe(String tenBienThe) { this.tenBienThe = tenBienThe; }
}
