package com.asturias2026.kitchen;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface KitchenMemberRepository extends JpaRepository<KitchenMember, UUID> {

    List<KitchenMember> findByGroupNumber(int groupNumber);

    Optional<KitchenMember> findByGuestId(UUID guestId);

    Optional<KitchenMember> findByGroupNumberAndGuestId(int groupNumber, UUID guestId);

    void deleteByGroupNumberAndGuestId(int groupNumber, UUID guestId);
}
