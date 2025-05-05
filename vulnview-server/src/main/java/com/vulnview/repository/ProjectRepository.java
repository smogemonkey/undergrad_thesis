package com.vulnview.repository;

import com.vulnview.entity.Project;
import com.vulnview.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    Page<Project> findByOwner(User owner, Pageable pageable);
    
    @Query("SELECT p FROM Project p WHERE p.name LIKE %:search% OR p.description LIKE %:search%")
    Page<Project> searchProjects(String search, Pageable pageable);
    
    List<Project> findByComponentsId(Long componentId);
    
    Optional<Project> findByNameAndOwner(String name, User owner);
    
    boolean existsByNameAndOwner(String name, User owner);

    List<Project> findByOwnerId(Long ownerId);
    boolean existsByNameAndOwnerId(String name, Long ownerId);

    @Query("SELECT p FROM Project p WHERE p.name = :name AND p.owner.id = :ownerId")
    Optional<Project> findByNameAndOwnerId(String name, Long ownerId);
} 