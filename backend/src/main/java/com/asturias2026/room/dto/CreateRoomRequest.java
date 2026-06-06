package com.asturias2026.room.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record CreateRoomRequest(
        @NotBlank String name,
        @NotBlank String floor,
        @Min(0) int bedCount,
        int position) {}
