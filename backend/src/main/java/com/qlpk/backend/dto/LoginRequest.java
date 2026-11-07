package com.qlpk.backend.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String identity; // có thể là email, username, số điện thoại
    private String password;
}
