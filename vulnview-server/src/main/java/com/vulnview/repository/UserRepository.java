package com.vulnview.repository;

import com.vulnview.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByGithubUsername(String githubUsername);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByGithubUsername(String githubUsername);
    long countByLastLoginAtAfter(LocalDateTime dateTime);
} 