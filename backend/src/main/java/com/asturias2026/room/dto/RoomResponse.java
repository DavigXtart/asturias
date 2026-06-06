package com.asturias2026.room.dto;

import java.util.UUID;

public record RoomResponse(UUID id, String name, String floor, int bedCount, int position) {}
