package com.asturias2026.room.dto;

import java.util.List;

public record UpdateRoomRequest(String name, int bedCount, List<BedInput> beds) {
    public record BedInput(String bedType, int position) {}
}
