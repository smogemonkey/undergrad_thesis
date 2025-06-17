package com.vulnview.service;

import com.vulnview.entity.Repository;
import java.util.List;

public interface RepositoryService {
    List<Repository> getProjectRepositories(Long projectId);
    Repository getRepositoryById(Long repositoryId);
    Repository createRepository(Repository repository);
    Repository updateRepository(Repository repository);
    void deleteRepository(Long repositoryId);
    List<Repository> getAllRepositories();
} 