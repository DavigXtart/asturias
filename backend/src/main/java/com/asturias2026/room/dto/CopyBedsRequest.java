package com.asturias2026.room.dto;

import java.time.LocalDate;
import java.util.List;

public record CopyBedsRequest(LocalDate sourceDay, List<LocalDate> targetDays) {}
