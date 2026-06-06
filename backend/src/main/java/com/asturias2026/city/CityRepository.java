package com.asturias2026.city;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface CityRepository extends JpaRepository<City, UUID> {}
