package com.asturias2026.car;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface CarLegRepository extends JpaRepository<CarLeg, UUID> {

    List<CarLeg> findByDirection(String direction);
}
