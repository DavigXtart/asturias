package com.asturias2026.guest;

import com.asturias2026.common.ApiException;
import com.asturias2026.config_.ConfigService;
import com.asturias2026.config_.dto.ConfigResponse;
import com.asturias2026.guest.dto.GuestResponse;
import com.asturias2026.guest.dto.RegisterGuestRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class GuestService {

    private final GuestRepository repo;
    private final ConfigService config;

    public GuestService(GuestRepository repo, ConfigService config) {
        this.repo = repo;
        this.config = config;
    }

    public GuestResponse createName(String name) {
        return map(repo.save(new Guest(name)));
    }

    public List<GuestResponse> list() {
        return repo.findAll().stream().map(this::map).toList();
    }

    public GuestResponse register(UUID id, RegisterGuestRequest req) {
        Guest g = repo.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Invitado no encontrado"));
        ConfigResponse cfg = config.get();
        if (req.arrivalDate().isAfter(req.departureDate())) {
            throw bad("La llegada no puede ser posterior a la salida");
        }
        if (req.arrivalDate().isBefore(cfg.tripStart()) || req.departureDate().isAfter(cfg.tripEnd())) {
            throw bad("Las fechas deben estar entre " + cfg.tripStart() + " y " + cfg.tripEnd());
        }
        g.setCityId(req.cityId());
        g.setCityOther(req.cityOther());
        g.setArrivalDate(req.arrivalDate());
        g.setDepartureDate(req.departureDate());
        g.setCanDrive(req.canDrive());
        g.setRegistered(true);
        return map(repo.save(g));
    }

    public void delete(UUID id) {
        repo.deleteById(id);
    }

    GuestResponse map(Guest g) {
        return new GuestResponse(
                g.getId(), g.getFullName(), g.getCityId(), g.getCityOther(),
                g.getArrivalDate(), g.getDepartureDate(), g.isCanDrive(), g.isRegistered());
    }

    private ApiException bad(String msg) {
        return new ApiException(HttpStatus.BAD_REQUEST, msg);
    }
}
