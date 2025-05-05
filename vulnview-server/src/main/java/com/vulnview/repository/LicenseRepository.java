package com.vulnview.repository;

import com.vulnview.entity.License;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LicenseRepository extends JpaRepository<License, Long> {
    License findByLicenseId(String licenseId);

    @Query("SELECT l FROM License l WHERE " +
           "LOWER(l.licenseId) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(l.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(l.description) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<License> findBySearchString(@Param("search") String search, Pageable pageable);
} 