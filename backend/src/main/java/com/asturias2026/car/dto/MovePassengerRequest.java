package com.asturias2026.car.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record MovePassengerRequest(@NotNull UUID guestId, @NotNull UUID toLegId) {}
