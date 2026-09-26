package com.qlpk.backend.service;

public interface PermissionService {

    boolean hasRole(String username, String... allowedRoles);

    String getCurrentRole(String username);
}
