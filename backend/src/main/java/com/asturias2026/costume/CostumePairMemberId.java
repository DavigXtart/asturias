package com.asturias2026.costume;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class CostumePairMemberId implements Serializable {

    private UUID pairId;
    private UUID guestId;

    public CostumePairMemberId() {}

    public CostumePairMemberId(UUID pairId, UUID guestId) {
        this.pairId = pairId;
        this.guestId = guestId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof CostumePairMemberId that)) return false;
        return Objects.equals(pairId, that.pairId) && Objects.equals(guestId, that.guestId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(pairId, guestId);
    }
}
