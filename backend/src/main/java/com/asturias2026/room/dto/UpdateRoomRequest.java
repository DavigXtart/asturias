package com.asturias2026.room.dto;

import java.time.LocalDate;
import java.util.List;

public record UpdateRoomRequest(String name, int bedCount, LocalDate day, List<BedInput> beds) {
    public record BedInput(String bedType, int position) {}
}
