package com.asturias2026.config_;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class ConfigSeeder implements CommandLineRunner {

    private final AppConfigRepository repo;

    public ConfigSeeder(AppConfigRepository repo) {
        this.repo = repo;
    }

    @Override
    public void run(String... args) {
        if (repo.findById(1).isEmpty()) {
            AppConfig config = new AppConfig();
            config.setId(1);
            config.setTripStart(LocalDate.of(2026, 7, 10));
            config.setTripEnd(LocalDate.of(2026, 7, 17));
            config.setAdminPinHash(new BCryptPasswordEncoder().encode("1234"));
            repo.save(config);
        }
    }
}
