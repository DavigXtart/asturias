package com.asturias2026.car;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

public interface CarPassengerRepository extends JpaRepository<CarPassenger, CarPassengerId> {

    long countByCarLegId(UUID carLegId);

    boolean existsByCarLegIdAndGuestId(UUID carLegId, UUID guestId);

    List<CarPassenger> findByCarLegId(UUID carLegId);

    @Query("SELECT CASE WHEN COUNT(cp) > 0 THEN true ELSE false END FROM CarPassenger cp " +
           "JOIN CarLeg cl ON cp.carLegId = cl.id " +
           "WHERE cp.guestId = :guestId AND cl.direction = :direction")
    boolean existsInDirection(@Param("guestId") UUID guestId, @Param("direction") String direction);

    @Transactional
    void deleteByCarLegIdAndGuestId(UUID carLegId, UUID guestId);

    @Transactional
    void deleteByCarLegId(UUID carLegId);
}
