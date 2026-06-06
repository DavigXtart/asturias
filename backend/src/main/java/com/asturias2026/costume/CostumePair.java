package com.asturias2026.costume;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "costume_pairs")
public class CostumePair {

    @Id
    private UUID id = UUID.randomUUID();

    @Column(name = "draw_id", nullable = false)
    private UUID drawId;

    @Column(name = "group_index", nullable = false)
    private int groupIndex;

    @Column(name = "ball_color", nullable = false)
    private String ballColor;

    protected CostumePair() {}

    public CostumePair(UUID drawId, int groupIndex, String ballColor) {
        this.drawId = drawId;
        this.groupIndex = groupIndex;
        this.ballColor = ballColor;
    }

    public UUID getId() { return id; }
    public UUID getDrawId() { return drawId; }
    public int getGroupIndex() { return groupIndex; }
    public String getBallColor() { return ballColor; }
}
