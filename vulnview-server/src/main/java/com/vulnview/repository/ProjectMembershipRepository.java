package com.vulnview.repository;

import com.vulnview.entity.Project;
import com.vulnview.entity.User;
import com.vulnview.entity.ProjectRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectMembershipRepository extends JpaRepository<Project, Long> {
    @Modifying
    @Query("INSERT INTO ProjectMembership (projectId, userId, role) VALUES (:projectId, :userId, :role)")
    void addUserToProject(@Param("projectId") Long projectId, @Param("userId") Long userId, @Param("role") ProjectRole role);

    @Modifying
    @Query("DELETE FROM ProjectMembership WHERE projectId = :projectId AND userId = :userId")
    void deleteByProjectIdAndUserId(@Param("projectId") Long projectId, @Param("userId") Long userId);

    @Modifying
    @Query("UPDATE ProjectMembership SET role = :newRole WHERE projectId = :projectId AND userId = :userId")
    void updateUserRole(@Param("projectId") Long projectId, @Param("userId") Long userId, @Param("newRole") ProjectRole newRole);

    @Query("SELECT u FROM User u JOIN ProjectMembership pm ON u.id = pm.userId WHERE pm.projectId = :projectId")
    List<User> findUsersByProjectId(@Param("projectId") Long projectId);

    @Query("SELECT pm.role FROM ProjectMembership pm WHERE pm.projectId = :projectId AND pm.userId = :userId")
    Optional<ProjectRole> findRoleByProjectIdAndUserId(@Param("projectId") Long projectId, @Param("userId") Long userId);

    @Query("SELECT CASE WHEN COUNT(pm) > 0 THEN true ELSE false END FROM ProjectMembership pm WHERE pm.projectId = :projectId AND pm.userId = :userId")
    boolean existsByProjectIdAndUserId(@Param("projectId") Long projectId, @Param("userId") Long userId);

    @Query("SELECT p FROM Project p JOIN ProjectMembership pm ON p.id = pm.projectId WHERE pm.userId = :userId")
    List<Project> findProjectsByUserId(@Param("userId") Long userId);
} 