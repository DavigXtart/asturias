package com.asturias2026.car;

import com.asturias2026.car.dto.CarLegResponse;
import com.asturias2026.car.dto.CreateCarLegRequest;
import com.asturias2026.car.dto.MovePassengerRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class CarController {

    private final CarService service;

    public CarController(CarService service) {
        this.service = service;
    }

    @GetMapping("/cars")
    public List<CarLegResponse> list(@RequestParam String direction) {
        return service.listByDirection(direction);
    }

    @PostMapping("/cars")
    public CarLegResponse create(@Valid @RequestBody CreateCarLegRequest req) {
        return service.createLeg(req);
    }

    @PostMapping("/cars/{id}/join")
    public void join(@PathVariable UUID id, @RequestHeader("X-Guest-Id") UUID guestId) {
        service.join(id, guestId);
    }

    @DeleteMapping("/cars/{id}/leave")
    public void leave(@PathVariable UUID id, @RequestHeader("X-Guest-Id") UUID guestId) {
        service.leave(id, guestId);
    }

    @PostMapping("/admin/cars/{legId}/move")
    public void move(@PathVariable UUID legId, @Valid @RequestBody MovePassengerRequest req) {
        service.adminMove(legId, req.guestId(), req.toLegId());
    }

    @DeleteMapping("/admin/cars/{id}")
    public void deleteLeg(@PathVariable UUID id) {
        service.adminDeleteLeg(id);
    }
}
