package com.asturias2026.guest.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

public record RegisterGuestRequest(
        UUID cityId,
        String cityOther,
        @NotNull LocalDate arrivalDate,
        @NotNull LocalDate departureDate,
        boolean canDrive) {}
