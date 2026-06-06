package com.asturias2026.guest;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "guests")
public class Guest {

    @Id
    private UUID id = UUID.randomUUID();

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "city_id")
    private UUID cityId;

    @Column(name = "city_other")
    private String cityOther;

    @Column(name = "arrival_date")
    private LocalDate arrivalDate;

    @Column(name = "departure_date")
    private LocalDate departureDate;

    @Column(name = "can_drive", nullable = false)
    private boolean canDrive = false;

    @Column(name = "is_registered", nullable = false)
    private boolean registered = false;

    protected Guest() {}

    public Guest(String fullName) {
        this.fullName = fullName;
    }

    public UUID getId() { return id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public UUID getCityId() { return cityId; }
    public void setCityId(UUID cityId) { this.cityId = cityId; }
    public String getCityOther() { return cityOther; }
    public void setCityOther(String cityOther) { this.cityOther = cityOther; }
    public LocalDate getArrivalDate() { return arrivalDate; }
    public void setArrivalDate(LocalDate arrivalDate) { this.arrivalDate = arrivalDate; }
    public LocalDate getDepartureDate() { return departureDate; }
    public void setDepartureDate(LocalDate departureDate) { this.departureDate = departureDate; }
    public boolean isCanDrive() { return canDrive; }
    public void setCanDrive(boolean canDrive) { this.canDrive = canDrive; }
    public boolean isRegistered() { return registered; }
    public void setRegistered(boolean registered) { this.registered = registered; }
}
