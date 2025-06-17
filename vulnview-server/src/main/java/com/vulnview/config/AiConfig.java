package com.vulnview.config;

import com.google.genai.Client;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AiConfig {

    @Value("${vulnview.ai.api.key}")
    private String aiApiKey;

    @Value("${vulnview.ai.api.url}")
    private String aiApiUrl;

    @Bean
    public Client genAiClient() {
        return Client.builder()
            .apiKey(aiApiKey)
            .build();
    }
} 