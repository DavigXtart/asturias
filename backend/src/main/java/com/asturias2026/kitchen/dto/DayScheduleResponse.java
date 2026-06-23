package com.asturias2026.kitchen.dto;

import java.time.LocalDate;
import java.util.List;

public record DayScheduleResponse(LocalDate date, List<MealAssignment> meals) {}
