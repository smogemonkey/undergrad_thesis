package com.vulnview.service.impl;

import com.vulnview.entity.Repository;
import com.vulnview.entity.RepositorySyncHistory;
import com.vulnview.entity.SyncStatus;
import com.vulnview.entity.User;
import com.vulnview.exception.GitHubException;
import com.vulnview.repository.RepositoryRepository;
import com.vulnview.repository.RepositorySyncHistoryRepository;
import com.vulnview.service.GitHubIntegrationService;
import com.vulnview.service.RepositorySyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class RepositorySyncServiceImpl implements RepositorySyncService {

    private final GitHubIntegrationService githubService;
    private final RepositoryRepository repositoryRepository;
    private final RepositorySyncHistoryRepository syncHistoryRepository;
    private final Map<Long, SyncStatus> syncStatusMap = new ConcurrentHashMap<>();

    @Override
    @Async
    @Transactional
    public void syncRepository(Repository repository, User user) {
        Long repositoryId = repository.getId();
        log.info("Starting sync for repository: {} (ID: {})", repository.getName(), repositoryId);
        log.info("User attempting sync: {} (ID: {})", user.getUsername(), user.getId());
        
        syncStatusMap.put(repositoryId, SyncStatus.IN_PROGRESS);

        RepositorySyncHistory history = new RepositorySyncHistory();
        history.setRepository(repository);
        history.setStartTime(LocalDateTime.now());
        history.setStatus(SyncStatus.IN_PROGRESS);
        history.setSyncType("MANUAL");
        history.setTriggeredBy(user.getUsername());
        syncHistoryRepository.save(history);

        try {
            if (user.getGithubToken() == null) {
                log.error("GitHub token not found for user: {}", user.getUsername());
                throw new GitHubException("GitHub token not found for user");
            }
            
            log.info("GitHub token found for user: {}", user.getUsername());
            log.info("Attempting to get repository details for: {}/{}", repository.getOwner(), repository.getName());

            Map<String, Object> repoDetails = githubService.getRepositoryDetails(
                repository.getOwner(),
                repository.getName(),
                user.getGithubToken()
            );

            log.info("Successfully retrieved repository details: {}", repoDetails);

            repository.setDescription((String) repoDetails.get("description"));
            repository.setDefaultBranch((String) repoDetails.get("default_branch"));
            repository.setUpdatedAt(LocalDateTime.now().toString());

            repositoryRepository.save(repository);
            log.info("Repository details updated successfully");

            history.setEndTime(LocalDateTime.now());
            history.setStatus(SyncStatus.COMPLETED);
            syncHistoryRepository.save(history);
            syncStatusMap.put(repositoryId, SyncStatus.COMPLETED);
            log.info("Sync completed successfully for repository: {}", repository.getName());
        } catch (Exception e) {
            log.error("Error during repository sync: {}", e.getMessage(), e);
            history.setEndTime(LocalDateTime.now());
            history.setStatus(SyncStatus.FAILED);
            history.setErrorMessage(e.getMessage());
            syncHistoryRepository.save(history);
            syncStatusMap.put(repositoryId, SyncStatus.FAILED);
            throw new GitHubException("Failed to sync repository: " + e.getMessage(), e);
        }
    }

    @Override
    @Async
    @Transactional
    public void syncAllRepositories(User user) {
        List<Repository> repositories = repositoryRepository.findAllByUserId(user.getId());
        for (Repository repository : repositories) {
            try {
                syncRepository(repository, user);
            } catch (Exception e) {
                // Log error but continue with other repositories
                log.error("Error syncing repository {}: {}", repository.getName(), e.getMessage(), e);
            }
        }
    }

    @Override
    public SyncStatus getSyncStatus(Long repositoryId) {
        return syncStatusMap.getOrDefault(repositoryId, SyncStatus.NOT_STARTED);
    }

    @Override
    @Transactional(readOnly = true)
    public Repository getRepositoryById(Long repositoryId) {
        return repositoryRepository.findById(repositoryId)
            .orElseThrow(() -> new IllegalArgumentException("Repository not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<RepositorySyncHistory> getSyncHistory(Long repositoryId) {
        return syncHistoryRepository.findByRepositoryIdOrderByStartTimeDesc(repositoryId);
    }
} 