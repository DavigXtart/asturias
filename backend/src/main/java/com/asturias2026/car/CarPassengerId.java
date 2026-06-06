package com.asturias2026.car;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class CarPassengerId implements Serializable {

    private UUID carLegId;
    private UUID guestId;

    public CarPassengerId() {}

    public CarPassengerId(UUID carLegId, UUID guestId) {
        this.carLegId = carLegId;
        this.guestId = guestId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof CarPassengerId that)) return false;
        return Objects.equals(carLegId, that.carLegId) && Objects.equals(guestId, that.guestId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(carLegId, guestId);
    }
}
