package com.vulnview.repository;

import com.vulnview.entity.RepositorySyncHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RepositorySyncHistoryRepository extends JpaRepository<RepositorySyncHistory, Long> {
    List<RepositorySyncHistory> findByRepositoryIdOrderByStartTimeDesc(Long repositoryId);
    List<RepositorySyncHistory> findByRepositoryIdAndStatusOrderByStartTimeDesc(Long repositoryId, com.vulnview.entity.SyncStatus status);
} 