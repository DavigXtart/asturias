package com.asturias2026.room.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record DayDistributionResponse(
        LocalDate day,
        List<RoomWithGuests> rooms,
        List<GuestInfo> unassigned) {

    public record RoomWithGuests(UUID id, String name, String floor, int bedCount, List<GuestInfo> guests) {}
    public record GuestInfo(UUID id, String fullName) {}
}
