package com.asturias2026.config_;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "app_config")
public class AppConfig {

    @Id
    private Integer id = 1;

    @Column(name = "trip_start", nullable = false)
    private LocalDate tripStart;

    @Column(name = "trip_end", nullable = false)
    private LocalDate tripEnd;

    @Column(name = "admin_pin_hash", nullable = false)
    private String adminPinHash;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public LocalDate getTripStart() { return tripStart; }
    public void setTripStart(LocalDate tripStart) { this.tripStart = tripStart; }

    public LocalDate getTripEnd() { return tripEnd; }
    public void setTripEnd(LocalDate tripEnd) { this.tripEnd = tripEnd; }

    public String getAdminPinHash() { return adminPinHash; }
    public void setAdminPinHash(String adminPinHash) { this.adminPinHash = adminPinHash; }
}
