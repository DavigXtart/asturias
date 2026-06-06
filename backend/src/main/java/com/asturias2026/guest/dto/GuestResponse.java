package com.asturias2026.guest.dto;

import java.time.LocalDate;
import java.util.UUID;

public record GuestResponse(
        UUID id,
        String fullName,
        UUID cityId,
        String cityOther,
        LocalDate arrivalDate,
        LocalDate departureDate,
        boolean canDrive,
        boolean isRegistered) {}
