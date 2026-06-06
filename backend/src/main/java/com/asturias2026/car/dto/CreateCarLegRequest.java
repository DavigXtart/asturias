package com.asturias2026.car.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

public record CreateCarLegRequest(
        @NotNull UUID driverGuestId,
        @NotBlank String direction,
        @NotNull LocalDate travelDate,
        @NotBlank String place,
        @Min(0) int passengerSeats) {}
