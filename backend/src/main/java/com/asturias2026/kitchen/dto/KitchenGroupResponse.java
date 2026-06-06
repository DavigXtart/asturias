package com.asturias2026.kitchen.dto;

import java.util.List;

public record KitchenGroupResponse(int groupNumber, List<KitchenMemberResponse> members) {}
