package com.vulnview.dto.membership;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class MemberDto {
    private Long id;
    private Long userId;
    private String username;
    private String email;
    private String role;
    private LocalDateTime joinedAt;
    private LocalDateTime lastActiveAt;
} 
 