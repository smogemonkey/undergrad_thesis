package com.vulnview.service;

import com.vulnview.entity.User;
import com.vulnview.dto.GithubSyncRequest;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;

public interface UserService {
    User getCurrentUser();
    User getUserById(Long id);
    void deleteUser(Long id);
    User updateEmail(String newEmail);
    List<User> getAllUsers();

    /**
     * Create or update a user from GitHub authentication
     */
    User createOrUpdateUserFromGitHub(String githubUsername, String email, String githubToken);

    /**
     * Generate JWT token for a user
     */
    String generateToken(User user);

    @Transactional
    User syncGithub(String code);
} 