package com.asturias2026.costume;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface CostumeDrawRepository extends JpaRepository<CostumeDraw, UUID> {}
