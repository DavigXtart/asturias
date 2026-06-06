package com.asturias2026.room;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "room_assignments", uniqueConstraints = @UniqueConstraint(columnNames = {"day", "guest_id"}))
public class RoomAssignment {

    @Id
    private UUID id = UUID.randomUUID();

    @Column(nullable = false)
    private LocalDate day;

    @Column(name = "guest_id", nullable = false)
    private UUID guestId;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    protected RoomAssignment() {}

    public RoomAssignment(LocalDate day, UUID guestId, UUID roomId) {
        this.day = day;
        this.guestId = guestId;
        this.roomId = roomId;
    }

    public UUID getId() { return id; }
    public LocalDate getDay() { return day; }
    public UUID getGuestId() { return guestId; }
    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }
}
