package com.vulnview.repository;

import com.vulnview.entity.Notification;
import com.vulnview.entity.RiskLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    Page<Notification> findByProjectIdAndIsReadFalse(Long projectId, Pageable pageable);
    
    List<Notification> findByProjectIdAndSeverityInAndIsReadFalse(Long projectId, List<RiskLevel> severities);
    
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.id = :id")
    void markAsRead(Long id);
    
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.project.id = :projectId")
    void markAllAsRead(Long projectId);
    
    long countByProjectIdAndIsReadFalse(Long projectId);
    
    long countByProjectIdAndSeverityInAndIsReadFalse(Long projectId, List<RiskLevel> severities);
} 