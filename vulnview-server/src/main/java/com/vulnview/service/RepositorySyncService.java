package com.vulnview.service;

import com.vulnview.entity.Repository;
import com.vulnview.entity.RepositorySyncHistory;
import com.vulnview.entity.SyncStatus;
import com.vulnview.entity.User;

import java.util.List;

public interface RepositorySyncService {
    /**
     * Sync a single repository
     */
    void syncRepository(Repository repository, User user);

    /**
     * Sync all repositories for a user
     */
    void syncAllRepositories(User user);

    /**
     * Get sync status for a repository
     */
    SyncStatus getSyncStatus(Long repositoryId);

    /**
     * Get repository by ID
     */
    Repository getRepositoryById(Long repositoryId);

    /**
     * Get sync history for a repository
     */
    List<RepositorySyncHistory> getSyncHistory(Long repositoryId);
} 