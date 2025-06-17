package com.vulnview.service.impl;

import com.vulnview.entity.Repository;
import com.vulnview.repository.RepositoryRepository;
import com.vulnview.repository.ProjectRepository;
import com.vulnview.service.RepositoryService;
import com.vulnview.exception.NotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RepositoryServiceImpl implements RepositoryService {
    private final RepositoryRepository repositoryRepository;
    private final ProjectRepository projectRepository;

    @Autowired
    public RepositoryServiceImpl(RepositoryRepository repositoryRepository, ProjectRepository projectRepository) {
        this.repositoryRepository = repositoryRepository;
        this.projectRepository = projectRepository;
    }

    @Override
    public List<Repository> getProjectRepositories(Long projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new NotFoundException("Project not found");
        }
        return repositoryRepository.findByProjectId(projectId);
    }

    @Override
    public Repository getRepositoryById(Long repositoryId) {
        return repositoryRepository.findById(repositoryId)
                .orElseThrow(() -> new RuntimeException("Repository not found"));
    }

    @Override
    public Repository createRepository(Repository repository) {
        return repositoryRepository.save(repository);
    }

    @Override
    public Repository updateRepository(Repository repository) {
        if (!repositoryRepository.existsById(repository.getId())) {
            throw new RuntimeException("Repository not found");
        }
        return repositoryRepository.save(repository);
    }

    @Override
    public void deleteRepository(Long repositoryId) {
        if (!repositoryRepository.existsById(repositoryId)) {
            throw new RuntimeException("Repository not found");
        }
        repositoryRepository.deleteById(repositoryId);
    }

    @Override
    public List<Repository> getAllRepositories() {
        return repositoryRepository.findAll();
    }
} 