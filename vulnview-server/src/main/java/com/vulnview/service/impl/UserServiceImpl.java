package com.vulnview.service.impl;

import com.vulnview.entity.User;
import com.vulnview.repository.UserRepository;
import com.vulnview.service.GitHubIntegrationService;
import com.vulnview.service.UserService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.vulnview.dto.GithubSyncRequest;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final GitHubIntegrationService githubService;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private Long jwtExpiration;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder, GitHubIntegrationService githubService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.githubService = githubService;
    }

    @Override
    @Transactional(readOnly = true)
    public User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found");
        }
        userRepository.deleteById(id);
    }

    @Override
    @Transactional
    public User updateEmail(String newEmail) {
        User user = getCurrentUser();
        if (userRepository.existsByEmail(newEmail)) {
            throw new RuntimeException("Email already in use");
        }
        user.setEmail(newEmail);
        return userRepository.save(user);
    }

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    @Transactional
    public User createOrUpdateUserFromGitHub(String githubUsername, String email, String githubToken) {
        Optional<User> existingUser = userRepository.findByGithubUsername(githubUsername);
        
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            user.setGithubToken(githubToken);
            user.setLastLoginAt(LocalDateTime.now());
            return userRepository.save(user);
        }

        // Create new user
        User user = User.builder()
            .username(githubUsername)
            .email(email)
            .password(passwordEncoder.encode(githubToken)) // Use GitHub token as password
            .systemRole("USER")
            .githubUsername(githubUsername)
            .githubToken(githubToken)
            .enabled(true)
            .createdAt(LocalDateTime.now())
            .lastLoginAt(LocalDateTime.now())
            .build();

        return userRepository.save(user);
    }

    @Override
    public String generateToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);

        return Jwts.builder()
            .setSubject(user.getUsername())
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(SignatureAlgorithm.HS512, jwtSecret)
            .compact();
    }

    @Override
    @Transactional
    public User syncGithub(String code) {
        User user = getCurrentUser();
        Map<String, String> githubInfo = githubService.connectGitHubAccount(code, user.getUsername());
        user.setGithubUsername(githubInfo.get("username"));
        user.setGithubToken(githubInfo.get("token"));
        return userRepository.save(user);
    }
} 