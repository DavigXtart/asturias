package com.asturias2026.guest;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface GuestRepository extends JpaRepository<Guest, UUID> {

    List<Guest> findByRegisteredTrue();

    @Query("SELECT g FROM Guest g WHERE g.registered = true AND g.arrivalDate <= :day AND g.departureDate > :day")
    List<Guest> findPresentOn(@Param("day") LocalDate day);
}
