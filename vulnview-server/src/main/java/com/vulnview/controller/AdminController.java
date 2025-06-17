package com.vulnview.controller;

import com.vulnview.dto.admin.UserSummaryDto;
import com.vulnview.dto.admin.SystemStatsDto;
import com.vulnview.dto.RegisterRequestDto;
import com.vulnview.entity.User;
import com.vulnview.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<List<UserSummaryDto>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PostMapping("/users")
    public ResponseEntity<User> createUser(@RequestBody RegisterRequestDto request) {
        return ResponseEntity.ok(adminService.createUser(request));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody RegisterRequestDto request) {
        return ResponseEntity.ok(adminService.updateUser(id, request));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/users/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserSummaryDto> updateUserRole(
            @PathVariable Long id,
            @RequestParam String role) {
        if (!role.equals("ADMIN") && !role.equals("USER")) {
            throw new IllegalArgumentException("Invalid role. Must be either ADMIN or USER");
        }
        return ResponseEntity.ok(adminService.updateUserRole(id, role));
    }

    @GetMapping("/stats")
    public ResponseEntity<SystemStatsDto> getSystemStats() {
        return ResponseEntity.ok(adminService.getSystemStats());
    }
} 
 