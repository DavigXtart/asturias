package com.asturias2026.kitchen.dto;

import java.time.LocalDate;
import java.util.Map;

public record DayBalanceResponse(LocalDate date, Map<Integer, Integer> groupCounts) {}
