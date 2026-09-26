package com.qlpk.backend.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String identity; 
    private String password;
}
