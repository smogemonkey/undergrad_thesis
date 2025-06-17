package com.vulnview.service;

import com.vulnview.entity.Project;
import com.vulnview.entity.User;
import com.vulnview.entity.ProjectRole;
import java.util.List;

public interface ProjectMembershipService {
    /**
     * Add a user to a project with a specific role
     * @param projectId The ID of the project
     * @param userId The ID of the user to add
     * @param role The role to assign
     */
    void addUserToProject(Long projectId, Long userId, ProjectRole role);

    /**
     * Remove a user from a project
     * @param projectId The ID of the project
     * @param userId The ID of the user to remove
     */
    void removeUserFromProject(Long projectId, Long userId);

    /**
     * Update a user's role in a project
     * @param projectId The ID of the project
     * @param userId The ID of the user
     * @param newRole The new role to assign
     */
    void updateUserRole(Long projectId, Long userId, ProjectRole newRole);

    /**
     * Get all users in a project
     * @param projectId The ID of the project
     * @return List of users in the project
     */
    List<User> getProjectUsers(Long projectId);

    /**
     * Get a user's role in a project
     * @param projectId The ID of the project
     * @param userId The ID of the user
     * @return The user's role in the project
     */
    ProjectRole getUserRole(Long projectId, Long userId);

    /**
     * Check if a user is a member of a project
     * @param projectId The ID of the project
     * @param userId The ID of the user
     * @return true if the user is a member, false otherwise
     */
    boolean isUserMemberOfProject(Long projectId, Long userId);

    /**
     * Get all projects a user is a member of
     * @param userId The ID of the user
     * @return List of projects the user is a member of
     */
    List<Project> getUserProjects(Long userId);

    /**
     * Check if a user has access to a project
     */
    boolean hasAccess(Long projectId, Long userId);
} 