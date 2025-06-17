package com.vulnview.service.impl;

import com.vulnview.dto.RegisterRequestDto;
import com.vulnview.dto.admin.SystemStatsDto;
import com.vulnview.dto.admin.UserSummaryDto;
import com.vulnview.entity.User;
import com.vulnview.repository.UserRepository;
import com.vulnview.repository.ProjectRepository;
import com.vulnview.repository.BuildRepository;
import com.vulnview.repository.VulnerabilityRepository;
import com.vulnview.service.AdminService;
import com.vulnview.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final BuildRepository buildRepository;
    private final VulnerabilityRepository vulnerabilityRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public SystemStatsDto getSystemStats() {
        return SystemStatsDto.builder()
                .totalUsers(userRepository.count())
                .totalProjects(projectRepository.count())
                .totalBuilds(buildRepository.count())
                .totalVulnerabilities(vulnerabilityRepository.count())
                .activeUsers(userRepository.countByLastLoginAtAfter(LocalDateTime.now().minusDays(30)))
                .activeProjects(projectRepository.countByLastBuildAtAfter(LocalDateTime.now().minusDays(30)))
                .criticalVulnerabilities(vulnerabilityRepository.countBySeverity("CRITICAL"))
                .highVulnerabilities(vulnerabilityRepository.countBySeverity("HIGH"))
                .build();
    }

    @Override
    public List<UserSummaryDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToUserSummary)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UserSummaryDto updateUserRole(Long userId, String role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setSystemRole(role);
        return mapToUserSummary(userRepository.save(user));
    }

    @Override
    @Transactional
    public User createUser(RegisterRequestDto request) {
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setSystemRole(request.getSystemRole());
        user.setCompanyName("N/A");
        user.setCompanyDomain("N/A");
        user.setEnabled(true);
        return userRepository.save(user);
    }

    @Override
    @Transactional
    public User updateUser(Long id, RegisterRequestDto request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        user.setSystemRole(request.getSystemRole());
        return userRepository.save(user);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    private UserSummaryDto mapToUserSummary(User user) {
        return UserSummaryDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getSystemRole())
                .enabled(user.isEnabled())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .build();
    }
} 