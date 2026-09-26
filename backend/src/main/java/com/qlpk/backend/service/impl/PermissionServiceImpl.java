package com.qlpk.backend.service.impl;

import com.qlpk.backend.entity.TaiKhoan;
import com.qlpk.backend.repository.TaiKhoanRepository;
import com.qlpk.backend.service.PermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PermissionServiceImpl implements PermissionService {

    @Autowired
    private TaiKhoanRepository taiKhoanRepository;

    @Override
    public boolean hasRole(String username, String... allowedRoles) {
        if (username == null || username.isBlank() || allowedRoles == null || allowedRoles.length == 0) {
            return false;
        }

        String currentRole = getCurrentRole(username);
        if (currentRole == null || currentRole.isBlank()) {
            return false;
        }

        Set<String> allowedSet = Arrays.stream(allowedRoles)
                .map(String::toUpperCase)
                .collect(Collectors.toSet());

        return allowedSet.contains(currentRole.toUpperCase());
    }

    @Override
    public String getCurrentRole(String username) {
        if (username == null || username.isBlank()) {
            return null;
        }

        TaiKhoan taiKhoan = taiKhoanRepository.findByUsername(username);
        if (taiKhoan == null) {
            taiKhoan = taiKhoanRepository.findByEmail(username);
        }

        return taiKhoan != null ? taiKhoan.getVaiTro() : null;
    }
}
