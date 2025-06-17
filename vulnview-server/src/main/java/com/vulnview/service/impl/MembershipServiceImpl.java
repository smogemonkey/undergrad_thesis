package com.vulnview.service.impl;

import com.vulnview.dto.membership.*;
import com.vulnview.entity.Project;
import com.vulnview.entity.User;
import com.vulnview.entity.Membership;
import com.vulnview.exception.ResourceNotFoundException;
import com.vulnview.repository.ProjectRepository;
import com.vulnview.repository.UserRepository;
import com.vulnview.repository.MembershipRepository;
import com.vulnview.service.MembershipService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MembershipServiceImpl implements MembershipService {
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final MembershipRepository membershipRepository;

    @Override
    @Transactional(readOnly = true)
    public List<MemberDto> getProjectMembers(Long projectId) {
        log.info("Getting members for project {}", projectId);
        return membershipRepository.findByProjectId(projectId).stream()
            .map(this::toMemberDto)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public MemberDto addMember(Long projectId, AddMemberRequestDto request) {
        log.info("Adding member {} to project {}", request.getEmail(), projectId);
        
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));
        
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.getEmail()));

        Membership membership = new Membership();
        membership.setProject(project);
        membership.setUser(user);
        membership.setRole(request.getRole());
        
        return toMemberDto(membershipRepository.save(membership));
    }

    @Override
    @Transactional
    public MemberDto updateMemberRole(Long projectId, Long memberId, UpdateMemberRoleDto request) {
        log.info("Updating role for member {} in project {} to {}", memberId, projectId, request.getRole());
        
        Membership membership = membershipRepository.findById(memberId)
            .orElseThrow(() -> new ResourceNotFoundException("Membership not found"));
        
        if (!membership.getProject().getId().equals(projectId)) {
            throw new RuntimeException("Membership does not belong to the specified project");
        }
        
        membership.setRole(request.getRole());
        return toMemberDto(membershipRepository.save(membership));
    }

    @Override
    @Transactional
    public void removeMember(Long projectId, Long memberId) {
        log.info("Removing member {} from project {}", memberId, projectId);
        
        Membership membership = membershipRepository.findById(memberId)
            .orElseThrow(() -> new ResourceNotFoundException("Membership not found"));
        
        if (!membership.getProject().getId().equals(projectId)) {
            throw new RuntimeException("Membership does not belong to the specified project");
        }
        
        membershipRepository.delete(membership);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isUserProjectMember(Long userId, Long projectId) {
        return membershipRepository.existsByUserIdAndProjectId(userId, projectId);
    }

    @Override
    @Transactional(readOnly = true)
    public String getUserProjectRole(Long userId, Long projectId) {
        return membershipRepository.findByUserIdAndProjectId(userId, projectId)
            .map(Membership::getRole)
            .orElse(null);
    }

    private MemberDto toMemberDto(Membership membership) {
        return MemberDto.builder()
            .id(membership.getId())
            .userId(membership.getUser().getId())
            .username(membership.getUser().getUsername())
            .email(membership.getUser().getEmail())
            .role(membership.getRole())
            .joinedAt(membership.getCreatedAt())
            .lastActiveAt(membership.getUser().getLastLoginAt() != null ? 
                membership.getUser().getLastLoginAt() : membership.getCreatedAt())
            .build();
    }
} 