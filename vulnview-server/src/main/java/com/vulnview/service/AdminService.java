package com.vulnview.service;

import com.vulnview.dto.admin.SystemStatsDto;
import com.vulnview.dto.admin.UserSummaryDto;
import com.vulnview.dto.RegisterRequestDto;
import com.vulnview.entity.User;

import java.util.List;

public interface AdminService {
    /**
     * Get system statistics
     * @return System statistics
     */
    SystemStatsDto getSystemStats();

    /**
     * Get all users in the system
     * @return List of user summaries
     */
    List<UserSummaryDto> getAllUsers();

    /**
     * Update a user's system role
     * @param userId The ID of the user
     * @param role The new role
     * @return Updated user summary
     */
    UserSummaryDto updateUserRole(Long userId, String role);

    User createUser(RegisterRequestDto request);
    User updateUser(Long id, RegisterRequestDto request);
    void deleteUser(Long id);
} 
 