package com.vulnview.repository;

import com.vulnview.entity.Repository;
import com.vulnview.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.List;

@org.springframework.stereotype.Repository
public interface RepositoryRepository extends JpaRepository<Repository, Long> {
    Optional<Repository> findByOwnerAndNameAndProject(String owner, String name, Project project);
    List<Repository> findByProjectId(Long projectId);
    boolean existsByGithubRepoIdAndProjectId(Long githubRepoId, Long projectId);
    
    @Query("SELECT r FROM Repository r JOIN r.project p JOIN p.memberships m WHERE m.user.id = :userId")
    List<Repository> findAllByUserId(@Param("userId") Long userId);
} 