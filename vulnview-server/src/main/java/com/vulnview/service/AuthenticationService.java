package com.vulnview.service;

import com.vulnview.dto.auth.LoginRequestDto;
import com.vulnview.dto.auth.LoginResponseDto;
import com.vulnview.dto.auth.RegisterRequestDto;
import com.vulnview.dto.auth.RegisterResponseDto;
import com.vulnview.entity.User;
import com.vulnview.repository.UserRepository;
import com.vulnview.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Random;

import java.time.LocalDateTime;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private static final Logger logger = LoggerFactory.getLogger(AuthenticationService.class);
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final JavaMailSender mailSender;
    private final ConcurrentHashMap<String, String> otpStore = new ConcurrentHashMap<>();
    private final Random random = new Random();

    public void sendOtp(String email) {
        String otp = String.format("%06d", random.nextInt(999999));
        otpStore.put(email, otp);
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Your VulnView Registration OTP");
        message.setText("Your OTP for VulnView registration is: " + otp);
        mailSender.send(message);
        logger.info("[DEV] OTP for {} is {}", email, otp);
    }

    public boolean verifyOtp(String email, String otp) {
        String stored = otpStore.get(email);
        return stored != null && stored.equals(otp);
    }

    @Transactional
    public RegisterResponseDto register(RegisterRequestDto request) {
        if (!verifyOtp(request.getEmail(), request.getOtp())) {
            throw new RuntimeException("Invalid or expired OTP");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .systemRole("USER")
                .companyName(request.getCompanyName())
                .companyDomain(request.getCompanyDomain())
                .enabled(true)
                .createdAt(LocalDateTime.now())
                .build();

        userRepository.save(user);

        String token = jwtService.generateToken(user);
        return new RegisterResponseDto(token);
    }

    @Transactional
    public RegisterResponseDto registerAdmin(RegisterRequestDto request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .systemRole("ADMIN")
                .companyName(request.getCompanyName())
                .companyDomain(request.getCompanyDomain())
                .enabled(true)
                .createdAt(LocalDateTime.now())
                .build();

        userRepository.save(user);

        String token = jwtService.generateToken(user);
        return new RegisterResponseDto(token);
    }

    public LoginResponseDto login(LoginRequestDto request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        User user = (User) authentication.getPrincipal();
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        String token = jwtService.generateToken(user);
        return new LoginResponseDto(token);
    }

    @Transactional(readOnly = true)
    public User getCurrentUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public boolean hasRole(User user, String role) {
        return user.getSystemRole().equals(role);
    }

    public boolean isAdmin(User user) {
        return hasRole(user, "ADMIN");
    }

    public Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            User user = userRepository.findByUsername(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            return user.getId();
        }
        throw new RuntimeException("User not authenticated");
    }

    public boolean isAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            User user = userRepository.findByUsername(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            return isAdmin(user);
        }
        return false;
    }

    public boolean isProjectAdmin(Long projectId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            User user = userRepository.findByUsername(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            return user.getOwnedProjects().stream()
                    .anyMatch(project -> project.getId().equals(projectId));
        }
        return false;
    }

    public boolean isProjectMember(Long projectId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            User user = userRepository.findByUsername(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            return user.getProjects().stream()
                    .anyMatch(project -> project.getId().equals(projectId));
        }
        return false;
    }
} 