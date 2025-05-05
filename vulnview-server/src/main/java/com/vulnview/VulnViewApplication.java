package com.vulnview;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class VulnViewApplication {
    public static void main(String[] args) {
        SpringApplication.run(VulnViewApplication.class, args);
    }
} 