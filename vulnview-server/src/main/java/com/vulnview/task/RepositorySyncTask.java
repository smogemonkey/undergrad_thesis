package com.vulnview.task;

import com.vulnview.entity.User;
import com.vulnview.service.RepositorySyncService;
import com.vulnview.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class RepositorySyncTask {
    private static final Logger logger = LoggerFactory.getLogger(RepositorySyncTask.class);

    private final RepositorySyncService repositorySyncService;
    private final UserService userService;

    public RepositorySyncTask(
            RepositorySyncService repositorySyncService,
            UserService userService) {
        this.repositorySyncService = repositorySyncService;
        this.userService = userService;
    }

    @Scheduled(cron = "0 0 */6 * * *") // Run every 6 hours
    public void syncAllRepositories() {
        logger.info("Starting scheduled repository sync");
        try {
            List<User> users = userService.getAllUsers();
            for (User user : users) {
                try {
                    repositorySyncService.syncAllRepositories(user);
                    logger.info("Successfully synced repositories for user: {}", user.getUsername());
                } catch (Exception e) {
                    logger.error("Failed to sync repositories for user: " + user.getUsername(), e);
                }
            }
        } catch (Exception e) {
            logger.error("Failed to execute scheduled repository sync", e);
        }
        logger.info("Completed scheduled repository sync");
    }
} 