package com.asturias2026.guest.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateGuestRequest(@NotBlank String fullName) {}
