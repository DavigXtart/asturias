package com.asturias2026.room.dto;

import java.util.UUID;

public record BedResponse(UUID id, String bedType, int position, int capacity) {}
