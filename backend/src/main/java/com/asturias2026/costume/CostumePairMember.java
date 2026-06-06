package com.asturias2026.costume;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "costume_pair_members")
@IdClass(CostumePairMemberId.class)
public class CostumePairMember {

    @Id
    @Column(name = "pair_id")
    private UUID pairId;

    @Id
    @Column(name = "guest_id")
    private UUID guestId;

    @Column(name = "ball_color")
    private String ballColor;

    protected CostumePairMember() {}

    public CostumePairMember(UUID pairId, UUID guestId) {
        this.pairId = pairId;
        this.guestId = guestId;
    }

    public CostumePairMember(UUID pairId, UUID guestId, String ballColor) {
        this.pairId = pairId;
        this.guestId = guestId;
        this.ballColor = ballColor;
    }

    public UUID getPairId() { return pairId; }
    public UUID getGuestId() { return guestId; }
    public String getBallColor() { return ballColor; }
}
