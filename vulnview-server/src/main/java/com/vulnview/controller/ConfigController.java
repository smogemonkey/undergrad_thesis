package com.vulnview.controller;

import com.vulnview.service.AuthenticationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/config")
public class ConfigController extends BaseController {
    private final AuthenticationService authenticationService;

    @Value("${vulnview.nvd.api.base-url}")
    private String nvdBaseUrl;

    @Value("${vulnview.nvd.api.rate-limit}")
    private double nvdRateLimit;

    public ConfigController(AuthenticationService authenticationService) {
        super(authenticationService);
        this.authenticationService = authenticationService;
    }

    @GetMapping("/nvd")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getNvdConfig() {
        log.info("Retrieving NVD API configuration");
        return ResponseEntity.ok(Map.of(
            "baseUrl", nvdBaseUrl,
            "rateLimit", nvdRateLimit,
            "apiKeyConfigured", false
        ));
    }
} 