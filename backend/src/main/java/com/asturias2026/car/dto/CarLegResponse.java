package com.asturias2026.car.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CarLegResponse(
        UUID id,
        UUID driverGuestId,
        String direction,
        LocalDate travelDate,
        String place,
        int passengerSeats,
        List<PassengerInfo> passengers) {

    public record PassengerInfo(UUID guestId, String fullName) {}
}
