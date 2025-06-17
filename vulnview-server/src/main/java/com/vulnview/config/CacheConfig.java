package com.vulnview.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {
    
    @Value("${EPSS_CACHE_ENABLED:true}")
    private boolean epssCacheEnabled;
    
    @Value("${CISA_KEV_CACHE_ENABLED:true}")
    private boolean cisaKevCacheEnabled;
    
    @Value("${AI_REMEDIATION_CACHE_ENABLED:true}")
    private boolean aiRemediationCacheEnabled;
    
    @Value("${AI_ALTERNATIVE_CACHE_ENABLED:true}")
    private boolean aiAlternativeCacheEnabled;
    
    @Bean
    public CacheManager cacheManager() {
        ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager();
        if (epssCacheEnabled) {
            cacheManager.setCacheNames(java.util.Arrays.asList("epss"));
        }
        if (cisaKevCacheEnabled) {
            cacheManager.setCacheNames(java.util.Arrays.asList("cisaKev"));
        }
        if (aiRemediationCacheEnabled) {
            cacheManager.setCacheNames(java.util.Arrays.asList("aiRemediationCache"));
        }
        if (aiAlternativeCacheEnabled) {
            cacheManager.setCacheNames(java.util.Arrays.asList("aiAlternativeCache"));
        }
        return cacheManager;
    }
} 