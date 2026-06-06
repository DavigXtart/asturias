package com.asturias2026.room;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RoomAssignmentRepository extends JpaRepository<RoomAssignment, UUID> {

    List<RoomAssignment> findByDay(LocalDate day);

    Optional<RoomAssignment> findByDayAndGuestId(LocalDate day, UUID guestId);

    @Transactional
    void deleteByDayAndGuestId(LocalDate day, UUID guestId);
}
