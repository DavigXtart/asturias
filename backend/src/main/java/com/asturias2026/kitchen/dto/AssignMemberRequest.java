package com.asturias2026.kitchen.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record AssignMemberRequest(@NotNull UUID guestId) {}
