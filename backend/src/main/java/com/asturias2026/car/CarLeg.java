package com.asturias2026.car;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "car_legs")
public class CarLeg {

    @Id
    private UUID id = UUID.randomUUID();

    @Column(name = "driver_guest_id", nullable = false)
    private UUID driverGuestId;

    @Column(nullable = false)
    private String direction;

    @Column(name = "travel_date", nullable = false)
    private LocalDate travelDate;

    @Column(nullable = false)
    private String place;

    @Column(name = "passenger_seats", nullable = false)
    private int passengerSeats;

    protected CarLeg() {}

    public CarLeg(UUID driverGuestId, String direction, LocalDate travelDate, String place, int passengerSeats) {
        this.driverGuestId = driverGuestId;
        this.direction = direction;
        this.travelDate = travelDate;
        this.place = place;
        this.passengerSeats = passengerSeats;
    }

    public UUID getId() { return id; }
    public UUID getDriverGuestId() { return driverGuestId; }
    public String getDirection() { return direction; }
    public LocalDate getTravelDate() { return travelDate; }
    public String getPlace() { return place; }
    public int getPassengerSeats() { return passengerSeats; }
}
