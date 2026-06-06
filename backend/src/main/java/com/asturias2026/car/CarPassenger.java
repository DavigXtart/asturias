package com.asturias2026.car;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "car_passengers")
@IdClass(CarPassengerId.class)
public class CarPassenger {

    @Id
    @Column(name = "car_leg_id")
    private UUID carLegId;

    @Id
    @Column(name = "guest_id")
    private UUID guestId;

    protected CarPassenger() {}

    public CarPassenger(UUID carLegId, UUID guestId) {
        this.carLegId = carLegId;
        this.guestId = guestId;
    }

    public UUID getCarLegId() { return carLegId; }
    public UUID getGuestId() { return guestId; }
}
