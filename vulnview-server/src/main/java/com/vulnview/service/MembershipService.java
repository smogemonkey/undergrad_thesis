package com.vulnview.service;

import com.vulnview.dto.membership.MemberDto;
import com.vulnview.dto.membership.AddMemberRequestDto;
import com.vulnview.dto.membership.UpdateMemberRoleDto;
import java.util.List;

public interface MembershipService {
    /**
     * Get all members of a project
     * @param projectId The ID of the project
     * @return List of project members
     */
    List<MemberDto> getProjectMembers(Long projectId);

    /**
     * Add a new member to a project
     * @param projectId The ID of the project
     * @param request The member addition request
     * @return The added member
     */
    MemberDto addMember(Long projectId, AddMemberRequestDto request);

    /**
     * Update a member's role in a project
     * @param projectId The ID of the project
     * @param memberId The ID of the member
     * @param request The role update request
     * @return The updated member
     */
    MemberDto updateMemberRole(Long projectId, Long memberId, UpdateMemberRoleDto request);

    /**
     * Remove a member from a project
     * @param projectId The ID of the project
     * @param memberId The ID of the member
     */
    void removeMember(Long projectId, Long memberId);

    boolean isUserProjectMember(Long userId, Long projectId);
    String getUserProjectRole(Long userId, Long projectId);
} 
 