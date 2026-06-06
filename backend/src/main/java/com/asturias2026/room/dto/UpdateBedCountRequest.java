package com.asturias2026.room.dto;

import jakarta.validation.constraints.Min;

public record UpdateBedCountRequest(@Min(0) int bedCount) {}
