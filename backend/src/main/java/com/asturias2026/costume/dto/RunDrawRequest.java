package com.asturias2026.costume.dto;

import java.util.List;
import java.util.UUID;

public record RunDrawRequest(
        List<UUID> excludeGuestIds,
        List<ForcedPair> forcedPairs
) {
    public record ForcedPair(UUID guestId1, UUID guestId2) {}
}
