package com.asturias2026.config_.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record UpdateConfigRequest(
        @NotNull LocalDate tripStart,
        @NotNull LocalDate tripEnd,
        String newPin) {}
