package com.asturias2026.costume;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CostumePairRepository extends JpaRepository<CostumePair, UUID> {

    List<CostumePair> findByDrawIdOrderByGroupIndex(UUID drawId);

    @Query("SELECT cp FROM CostumePair cp JOIN CostumePairMember m ON m.pairId = cp.id WHERE m.guestId = :guestId")
    Optional<CostumePair> findPairOfGuest(@Param("guestId") UUID guestId);
}
