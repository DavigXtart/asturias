package com.asturias2026.car;

import com.asturias2026.car.dto.CarLegResponse;
import com.asturias2026.car.dto.CreateCarLegRequest;
import com.asturias2026.common.ApiException;
import com.asturias2026.guest.Guest;
import com.asturias2026.guest.GuestRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class CarService {

    private final CarLegRepository legRepo;
    private final CarPassengerRepository passengerRepo;
    private final GuestRepository guestRepo;

    public CarService(CarLegRepository legRepo, CarPassengerRepository passengerRepo, GuestRepository guestRepo) {
        this.legRepo = legRepo;
        this.passengerRepo = passengerRepo;
        this.guestRepo = guestRepo;
    }

    public CarLegResponse createLeg(CreateCarLegRequest req) {
        CarLeg leg = new CarLeg(req.driverGuestId(), req.direction(), req.travelDate(), req.place(), req.passengerSeats());
        leg = legRepo.save(leg);
        return mapLeg(leg);
    }

    public List<CarLegResponse> listByDirection(String direction) {
        return legRepo.findByDirection(direction).stream().map(this::mapLeg).toList();
    }

    @Transactional
    public void join(UUID legId, UUID guestId) {
        CarLeg leg = legRepo.findById(legId)
                .orElseThrow(() -> notFound("Coche no encontrado"));
        long taken = passengerRepo.countByCarLegId(legId);
        if (taken >= leg.getPassengerSeats()) {
            throw conflict("Coche lleno");
        }
        if (passengerRepo.existsInDirection(guestId, leg.getDirection())) {
            throw conflict("Ya vas en un coche en este sentido");
        }
        passengerRepo.save(new CarPassenger(legId, guestId));
    }

    @Transactional
    public void leave(UUID legId, UUID guestId) {
        passengerRepo.deleteByCarLegIdAndGuestId(legId, guestId);
    }

    @Transactional
    public void adminMove(UUID fromLegId, UUID guestId, UUID toLegId) {
        passengerRepo.deleteByCarLegIdAndGuestId(fromLegId, guestId);
        CarLeg toLeg = legRepo.findById(toLegId)
                .orElseThrow(() -> notFound("Coche destino no encontrado"));
        passengerRepo.save(new CarPassenger(toLegId, guestId));
    }

    @Transactional
    public void adminDeleteLeg(UUID legId) {
        passengerRepo.deleteByCarLegId(legId);
        legRepo.deleteById(legId);
    }

    private CarLegResponse mapLeg(CarLeg leg) {
        List<CarPassenger> passengers = passengerRepo.findByCarLegId(leg.getId());
        List<CarLegResponse.PassengerInfo> pInfo = passengers.stream()
                .map(cp -> {
                    String name = guestRepo.findById(cp.getGuestId())
                            .map(Guest::getFullName).orElse("?");
                    return new CarLegResponse.PassengerInfo(cp.getGuestId(), name);
                })
                .toList();
        return new CarLegResponse(
                leg.getId(), leg.getDriverGuestId(), leg.getDirection(),
                leg.getTravelDate(), leg.getPlace(), leg.getPassengerSeats(), pInfo);
    }

    private ApiException notFound(String msg) {
        return new ApiException(HttpStatus.NOT_FOUND, msg);
    }

    private ApiException conflict(String msg) {
        return new ApiException(HttpStatus.CONFLICT, msg);
    }
}
