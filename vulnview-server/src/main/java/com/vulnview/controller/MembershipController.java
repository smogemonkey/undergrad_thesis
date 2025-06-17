package com.vulnview.controller;

import com.vulnview.dto.membership.AddMemberRequestDto;
import com.vulnview.dto.membership.MemberDto;
import com.vulnview.dto.membership.UpdateMemberRoleDto;
import com.vulnview.service.MembershipService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/projects/{projectId}/members")
@RequiredArgsConstructor
public class MembershipController {
    private final MembershipService membershipService;

    @GetMapping
    public ResponseEntity<List<MemberDto>> getProjectMembers(@PathVariable Long projectId) {
        log.info("Received request to get members for project {}", projectId);
        List<MemberDto> members = membershipService.getProjectMembers(projectId);
        return ResponseEntity.ok(members);
    }

    @PostMapping
    public ResponseEntity<MemberDto> addProjectMember(@PathVariable Long projectId, @RequestBody AddMemberRequestDto request) {
        log.info("Received request to add member to project {}", projectId);
        MemberDto newMember = membershipService.addMember(projectId, request);
        return ResponseEntity.ok(newMember);
    }

    @PutMapping("/{memberId}/role")
    public ResponseEntity<MemberDto> updateMemberRole(
            @PathVariable Long projectId,
            @PathVariable Long memberId,
            @RequestBody UpdateMemberRoleDto request) {
        log.info("Received request to update member {} role in project {}", memberId, projectId);
        return ResponseEntity.ok(membershipService.updateMemberRole(projectId, memberId, request));
    }

    @DeleteMapping("/{memberId}")
    public ResponseEntity<?> removeProjectMember(@PathVariable Long projectId, @PathVariable Long memberId) {
        log.info("Received request to remove member {} from project {}", memberId, projectId);
        membershipService.removeMember(projectId, memberId);
        return ResponseEntity.noContent().build();
    }
} 
 