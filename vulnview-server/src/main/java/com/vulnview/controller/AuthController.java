package com.vulnview.controller;

import com.vulnview.dto.auth.LoginRequestDto;
import com.vulnview.dto.auth.LoginResponseDto;
import com.vulnview.dto.auth.RegisterRequestDto;
import com.vulnview.dto.auth.RegisterResponseDto;
import com.vulnview.entity.User;
import com.vulnview.service.AuthenticationService;
import com.vulnview.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController extends BaseController {

    private final UserService userService;

    public AuthController(AuthenticationService authenticationService, UserService userService) {
        super(authenticationService);
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponseDto> register(@RequestBody RegisterRequestDto request) {
        return ResponseEntity.ok(authenticationService.register(request));
    }

    @PostMapping("/register/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RegisterResponseDto> registerAdmin(@RequestBody RegisterRequestDto request) {
        return ResponseEntity.ok(authenticationService.registerAdmin(request));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@RequestBody LoginRequestDto request) {
        return ResponseEntity.ok(authenticationService.login(request));
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<User> getCurrentUser() {
        return ResponseEntity.ok(userService.getCurrentUser());
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }
        try {
            authenticationService.sendOtp(email);
            return ResponseEntity.ok(Map.of("message", "OTP sent"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to send OTP"));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp = body.get("otp");
        if (email == null || email.isEmpty() || otp == null || otp.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and OTP are required"));
        }
        try {
            boolean isValid = authenticationService.verifyOtp(email, otp);
            if (isValid) {
                return ResponseEntity.ok(Map.of("message", "OTP verified successfully"));
            } else {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired OTP"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to verify OTP"));
        }
    }
} 