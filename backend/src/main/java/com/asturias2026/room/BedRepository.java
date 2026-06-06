package com.asturias2026.room;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface BedRepository extends JpaRepository<Bed, UUID> {
    List<Bed> findByRoomIdAndDayOrderByPositionAsc(UUID roomId, LocalDate day);
    List<Bed> findByDayOrderByPositionAsc(LocalDate day);
    void deleteByRoomIdAndDay(UUID roomId, LocalDate day);
    void deleteByRoomId(UUID roomId);
}
