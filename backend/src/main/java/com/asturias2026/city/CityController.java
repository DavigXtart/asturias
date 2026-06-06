package com.asturias2026.city;

import com.asturias2026.city.dto.CityResponse;
import com.asturias2026.city.dto.CreateCityRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class CityController {

    private final CityRepository repo;

    public CityController(CityRepository repo) {
        this.repo = repo;
    }

    @GetMapping("/cities")
    public List<CityResponse> list() {
        return repo.findAll().stream()
                .map(c -> new CityResponse(c.getId(), c.getName()))
                .toList();
    }

    @PostMapping("/admin/cities")
    public CityResponse create(@Valid @RequestBody CreateCityRequest req) {
        City c = repo.save(new City(req.name()));
        return new CityResponse(c.getId(), c.getName());
    }

    @DeleteMapping("/admin/cities/{id}")
    public void delete(@PathVariable UUID id) {
        repo.deleteById(id);
    }
}
