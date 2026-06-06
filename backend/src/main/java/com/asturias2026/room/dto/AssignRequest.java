package com.asturias2026.room.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

public record AssignRequest(
        @NotNull LocalDate day,
        @NotNull UUID guestId,
        @NotNull UUID roomId) {}
