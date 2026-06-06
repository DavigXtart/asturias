package com.asturias2026.guest;

import com.asturias2026.guest.dto.CreateGuestRequest;
import com.asturias2026.guest.dto.GuestResponse;
import com.asturias2026.guest.dto.RegisterGuestRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class GuestController {

    private final GuestService service;

    public GuestController(GuestService service) {
        this.service = service;
    }

    @GetMapping("/guests")
    public List<GuestResponse> list() {
        return service.list();
    }

    @PostMapping("/admin/guests")
    public GuestResponse create(@Valid @RequestBody CreateGuestRequest req) {
        return service.createName(req.fullName());
    }

    @PutMapping("/guests/{id}/register")
    public GuestResponse register(@PathVariable UUID id, @Valid @RequestBody RegisterGuestRequest req) {
        return service.register(id, req);
    }

    @DeleteMapping("/admin/guests/{id}")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}
