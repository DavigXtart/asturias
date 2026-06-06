package com.asturias2026.city.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateCityRequest(@NotBlank String name) {}
