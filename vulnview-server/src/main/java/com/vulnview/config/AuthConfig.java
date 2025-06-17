package com.vulnview.config;

import com.vulnview.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.vulnview.entity.User;

@Component
@RequiredArgsConstructor
public class AuthConfig implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByUsername("admin")) {
            User admin = User.builder()
                    .username("admin")
                    .email("admin@vulnview.com")
                    .password(passwordEncoder.encode("admin"))
                    .systemRole("ADMIN")
                    .companyName("VulnView")
                    .companyDomain("tech")
                    .enabled(true)
                    .build();
            userRepository.save(admin);
        }
    }
} 