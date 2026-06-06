package com.asturias2026.room;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "rooms")
public class Room {

    @Id
    private UUID id = UUID.randomUUID();

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String floor;

    @Column(name = "bed_count", nullable = false)
    private int bedCount;

    @Column(nullable = false)
    private int position = 0;

    protected Room() {}

    public Room(String name, String floor, int bedCount, int position) {
        this.name = name;
        this.floor = floor;
        this.bedCount = bedCount;
        this.position = position;
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getFloor() { return floor; }
    public void setFloor(String floor) { this.floor = floor; }
    public int getBedCount() { return bedCount; }
    public void setBedCount(int bedCount) { this.bedCount = bedCount; }
    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }
}
