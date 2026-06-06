package com.asturias2026.room;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "beds")
public class Bed {

    @Id
    private UUID id = UUID.randomUUID();

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "bed_type", nullable = false)
    private String bedType; // INDIVIDUAL or MATRIMONIO

    @Column(nullable = false)
    private int position = 0;

    protected Bed() {}

    public Bed(UUID roomId, String bedType, int position) {
        this.roomId = roomId;
        this.bedType = bedType;
        this.position = position;
    }

    public UUID getId() { return id; }
    public UUID getRoomId() { return roomId; }
    public String getBedType() { return bedType; }
    public void setBedType(String bedType) { this.bedType = bedType; }
    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }

    /** Number of people this bed can hold */
    public int capacity() {
        return "MATRIMONIO".equals(bedType) ? 2 : 1;
    }
}
