package com.asturias2026.costume;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface CostumePairMemberRepository extends JpaRepository<CostumePairMember, CostumePairMemberId> {

    List<CostumePairMember> findByPairId(UUID pairId);

    @Query("SELECT g.fullName FROM Guest g JOIN CostumePairMember m ON m.guestId = g.id " +
           "WHERE m.pairId = :pairId AND m.guestId <> :excludeGuestId")
    List<String> findGuestNamesByPairExcluding(@Param("pairId") UUID pairId, @Param("excludeGuestId") UUID excludeGuestId);
}
