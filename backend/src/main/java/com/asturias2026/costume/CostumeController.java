package com.asturias2026.costume;

import com.asturias2026.costume.dto.AdminPairsResponse;
import com.asturias2026.costume.dto.DrawResult;
import com.asturias2026.costume.dto.MyPairResponse;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class CostumeController {

    private final DrawService service;

    public CostumeController(DrawService service) {
        this.service = service;
    }

    @PostMapping("/admin/costume/draw")
    public DrawResult runDraw() {
        return service.runDraw();
    }

    @GetMapping("/costume/me")
    public MyPairResponse myPair(@RequestHeader("X-Guest-Id") UUID guestId) {
        return service.myPair(guestId);
    }

    @GetMapping("/admin/costume/pairs")
    public List<AdminPairsResponse> allPairs() {
        return service.allPairs();
    }
}
