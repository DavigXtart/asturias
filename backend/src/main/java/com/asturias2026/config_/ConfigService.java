package com.asturias2026.config_;

import com.asturias2026.common.ApiException;
import com.asturias2026.config_.dto.ConfigResponse;
import com.asturias2026.config_.dto.UpdateConfigRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class ConfigService {

    private final AppConfigRepository repo;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public ConfigService(AppConfigRepository repo) {
        this.repo = repo;
    }

    private AppConfig entity() {
        return repo.findById(1)
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Config no inicializada"));
    }

    public ConfigResponse get() {
        AppConfig c = entity();
        return new ConfigResponse(c.getTripStart(), c.getTripEnd());
    }

    public boolean pinMatches(String pin) {
        if (pin == null) return false;
        return encoder.matches(pin, entity().getAdminPinHash());
    }

    public ConfigResponse update(UpdateConfigRequest req) {
        if (req.tripStart().isAfter(req.tripEnd())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "La fecha de inicio no puede ser posterior a la de fin");
        }
        AppConfig c = entity();
        c.setTripStart(req.tripStart());
        c.setTripEnd(req.tripEnd());
        if (req.newPin() != null && !req.newPin().isBlank()) {
            c.setAdminPinHash(encoder.encode(req.newPin()));
        }
        repo.save(c);
        return get();
    }
}
