package com.vulnview.service.impl;

import com.vulnview.entity.Project;
import com.vulnview.entity.User;
import com.vulnview.entity.ProjectRole;
import com.vulnview.repository.ProjectRepository;
import com.vulnview.repository.UserRepository;
import com.vulnview.repository.ProjectMembershipRepository;
import com.vulnview.service.ProjectMembershipService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectMembershipServiceImpl implements ProjectMembershipService {
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectMembershipRepository projectMembershipRepository;

    @Override
    @Transactional
    public void addUserToProject(Long projectId, Long userId, ProjectRole role) {
        log.info("Adding user {} to project {} with role {}", userId, projectId, role);
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found"));
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        projectMembershipRepository.addUserToProject(projectId, userId, role);
    }

    @Override
    @Transactional
    public void removeUserFromProject(Long projectId, Long userId) {
        log.info("Removing user {} from project {}", userId, projectId);
        projectMembershipRepository.deleteByProjectIdAndUserId(projectId, userId);
    }

    @Override
    @Transactional
    public void updateUserRole(Long projectId, Long userId, ProjectRole newRole) {
        log.info("Updating role of user {} in project {} to {}", userId, projectId, newRole);
        projectMembershipRepository.updateUserRole(projectId, userId, newRole);
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> getProjectUsers(Long projectId) {
        log.info("Getting users for project {}", projectId);
        return projectMembershipRepository.findUsersByProjectId(projectId);
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectRole getUserRole(Long projectId, Long userId) {
        log.info("Getting role of user {} in project {}", userId, projectId);
        return projectMembershipRepository.findRoleByProjectIdAndUserId(projectId, userId)
            .orElseThrow(() -> new RuntimeException("User is not a member of this project"));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isUserMemberOfProject(Long projectId, Long userId) {
        log.info("Checking if user {} is a member of project {}", userId, projectId);
        return projectMembershipRepository.existsByProjectIdAndUserId(projectId, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Project> getUserProjects(Long userId) {
        log.info("Getting projects for user {}", userId);
        return projectMembershipRepository.findProjectsByUserId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasAccess(Long projectId, Long userId) {
        log.info("Checking if user {} has access to project {}", userId, projectId);
        return projectMembershipRepository.existsByProjectIdAndUserId(projectId, userId);
    }
} 