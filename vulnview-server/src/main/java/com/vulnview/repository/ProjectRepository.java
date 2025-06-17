package com.vulnview.repository;

import com.vulnview.entity.Project;
import com.vulnview.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    @Query("SELECT p FROM Project p WHERE p.ownerId = :ownerId")
    Page<Project> findByOwnerId(@Param("ownerId") Long ownerId, Pageable pageable);
    
    @Query("SELECT p FROM Project p WHERE p.name LIKE %:search% OR p.description LIKE %:search%")
    Page<Project> searchProjects(String search, Pageable pageable);
    
    List<Project> findByComponentsId(Long componentId);
    
    @Query("SELECT p FROM Project p WHERE p.name = :name")
    Optional<Project> findByName(@Param("name") String name);

    default Optional<Project> findLatestByName(String name) {
        return findByName(name);
    }

    List<Project> findByOwnerId(Long ownerId);
    boolean existsByNameAndOwnerId(String name, Long ownerId);

    @Query("SELECT p FROM Project p WHERE p.name = :name AND p.ownerId = :ownerId")
    Optional<Project> findByNameAndOwnerId(@Param("name") String name, @Param("ownerId") Long ownerId);

    @Query("SELECT p FROM Project p JOIN p.memberships m WHERE m.user.id = :memberId")
    List<Project> findByMembersId(@Param("memberId") Long memberId);

    long countByLastBuildAtAfter(LocalDateTime dateTime);
} 