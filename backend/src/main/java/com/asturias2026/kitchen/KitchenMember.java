package com.asturias2026.kitchen;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "kitchen_members")
public class KitchenMember {

    @Id
    private UUID id = UUID.randomUUID();

    @Column(name = "group_number", nullable = false)
    private int groupNumber;

    @Column(name = "guest_id", nullable = false)
    private UUID guestId;

    protected KitchenMember() {}

    public KitchenMember(int groupNumber, UUID guestId) {
        this.groupNumber = groupNumber;
        this.guestId = guestId;
    }

    public UUID getId() { return id; }
    public int getGroupNumber() { return groupNumber; }
    public void setGroupNumber(int groupNumber) { this.groupNumber = groupNumber; }
    public UUID getGuestId() { return guestId; }
    public void setGuestId(UUID guestId) { this.guestId = guestId; }
}
