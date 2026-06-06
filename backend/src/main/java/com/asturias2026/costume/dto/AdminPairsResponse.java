package com.asturias2026.costume.dto;

import java.util.List;

public record AdminPairsResponse(
        int groupIndex,
        String ballColor,
        List<String> members) {}
