package com.asturias2026.costume;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "costume_draw")
public class CostumeDraw {

    @Id
    private UUID id = UUID.randomUUID();

    @Column(nullable = false)
    private String status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected CostumeDraw() {}

    public CostumeDraw(String status) {
        this.status = status;
    }

    public UUID getId() { return id; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
}
