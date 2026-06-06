package com.asturias2026.config_;

import com.asturias2026.config_.dto.ConfigResponse;
import com.asturias2026.config_.dto.UpdateConfigRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ConfigController {

    private final ConfigService service;

    public ConfigController(ConfigService service) {
        this.service = service;
    }

    @GetMapping("/config")
    public ConfigResponse get() {
        return service.get();
    }

    @GetMapping("/admin/config")
    public ConfigResponse getAdmin() {
        return service.get();
    }

    @PutMapping("/admin/config")
    public ConfigResponse update(@Valid @RequestBody UpdateConfigRequest req) {
        return service.update(req);
    }
}
