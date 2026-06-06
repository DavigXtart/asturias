package com.asturias2026.room;

import com.asturias2026.room.dto.*;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class RoomController {

    private final RoomService service;

    public RoomController(RoomService service) {
        this.service = service;
    }

    @GetMapping("/rooms")
    public List<RoomResponse> list() {
        return service.listRooms();
    }

    @PostMapping("/admin/rooms")
    public RoomResponse create(@Valid @RequestBody CreateRoomRequest req) {
        return service.createRoom(req);
    }

    @PutMapping("/rooms/{id}")
    public RoomResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateRoomRequest req) {
        return service.updateRoom(id, req);
    }

    @PutMapping("/admin/rooms/{id}/beds")
    public RoomResponse updateBeds(@PathVariable UUID id, @Valid @RequestBody UpdateBedCountRequest req) {
        return service.updateBedCount(id, req.bedCount());
    }

    @GetMapping("/rooms/{id}/beds")
    public java.util.List<BedResponse> getBeds(
            @PathVariable UUID id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate day) {
        return service.getBeds(id, day);
    }

    @DeleteMapping("/admin/rooms/{id}")
    public void delete(@PathVariable UUID id) {
        service.deleteRoom(id);
    }

    @GetMapping("/rooms/distribution")
    public DayDistributionResponse distribution(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate day) {
        return service.dayDistribution(day);
    }

    @PutMapping("/rooms/assign")
    public void assign(@Valid @RequestBody AssignRequest req) {
        service.assign(req.day(), req.guestId(), req.roomId());
    }

    @DeleteMapping("/rooms/assign")
    public void unassign(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate day,
            @RequestParam UUID guestId) {
        service.unassign(day, guestId);
    }
}
