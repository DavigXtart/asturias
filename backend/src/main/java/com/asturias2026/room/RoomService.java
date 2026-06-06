package com.asturias2026.room;

import com.asturias2026.common.ApiException;
import com.asturias2026.guest.Guest;
import com.asturias2026.guest.GuestRepository;
import com.asturias2026.room.dto.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RoomService {

    private final RoomRepository roomRepo;
    private final RoomAssignmentRepository assignmentRepo;
    private final GuestRepository guestRepo;
    private final BedRepository bedRepo;

    public RoomService(RoomRepository roomRepo, RoomAssignmentRepository assignmentRepo,
                       GuestRepository guestRepo, BedRepository bedRepo) {
        this.roomRepo = roomRepo;
        this.assignmentRepo = assignmentRepo;
        this.guestRepo = guestRepo;
        this.bedRepo = bedRepo;
    }

    public List<RoomResponse> listRooms() {
        return roomRepo.findAllByOrderByFloorAscPositionAsc().stream()
                .map(r -> new RoomResponse(r.getId(), r.getName(), r.getFloor(), r.getBedCount(), r.getPosition()))
                .toList();
    }

    public RoomResponse createRoom(CreateRoomRequest req) {
        Room room = roomRepo.save(new Room(req.name(), req.floor(), req.bedCount(), req.position()));
        return new RoomResponse(room.getId(), room.getName(), room.getFloor(), room.getBedCount(), room.getPosition());
    }

    public RoomResponse updateBedCount(UUID roomId, int bedCount) {
        Room room = roomRepo.findById(roomId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Habitacion no encontrada"));
        room.setBedCount(bedCount);
        room = roomRepo.save(room);
        return new RoomResponse(room.getId(), room.getName(), room.getFloor(), room.getBedCount(), room.getPosition());
    }

    @Transactional
    public RoomResponse updateRoom(UUID roomId, UpdateRoomRequest req) {
        Room room = roomRepo.findById(roomId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Habitacion no encontrada"));
        if (req.name() != null) room.setName(req.name());
        room.setBedCount(req.bedCount());
        room = roomRepo.save(room);

        if (req.beds() != null) {
            bedRepo.deleteByRoomId(roomId);
            int pos = 0;
            for (UpdateRoomRequest.BedInput b : req.beds()) {
                bedRepo.save(new Bed(roomId, b.bedType(), pos++));
            }
        }
        return new RoomResponse(room.getId(), room.getName(), room.getFloor(), room.getBedCount(), room.getPosition());
    }

    public List<BedResponse> getBeds(UUID roomId) {
        return bedRepo.findByRoomIdOrderByPositionAsc(roomId).stream()
                .map(b -> new BedResponse(b.getId(), b.getBedType(), b.getPosition(), b.capacity()))
                .toList();
    }

    public void deleteRoom(UUID roomId) {
        bedRepo.deleteByRoomId(roomId);
        roomRepo.deleteById(roomId);
    }

    public DayDistributionResponse dayDistribution(LocalDate day) {
        List<Room> rooms = roomRepo.findAllByOrderByFloorAscPositionAsc();
        List<Guest> present = guestRepo.findPresentOn(day);
        List<RoomAssignment> assignments = assignmentRepo.findByDay(day);
        List<Bed> allBeds = bedRepo.findAll();

        // Build a map: roomId -> list of beds
        Map<UUID, List<Bed>> bedsByRoom = allBeds.stream()
                .collect(Collectors.groupingBy(Bed::getRoomId));

        // Build a map: roomId -> list of assigned guest IDs
        Map<UUID, List<UUID>> roomAssignments = assignments.stream()
                .collect(Collectors.groupingBy(RoomAssignment::getRoomId,
                        Collectors.mapping(RoomAssignment::getGuestId, Collectors.toList())));

        // Build guest lookup
        Map<UUID, Guest> guestMap = present.stream()
                .collect(Collectors.toMap(Guest::getId, g -> g));

        Set<UUID> assignedGuestIds = new HashSet<>();
        List<DayDistributionResponse.RoomWithGuests> roomResults = rooms.stream().map(room -> {
            List<UUID> guestIds = roomAssignments.getOrDefault(room.getId(), List.of());
            List<DayDistributionResponse.GuestInfo> guests = guestIds.stream()
                    .filter(guestMap::containsKey)
                    .map(gid -> {
                        assignedGuestIds.add(gid);
                        Guest g = guestMap.get(gid);
                        return new DayDistributionResponse.GuestInfo(g.getId(), g.getFullName());
                    })
                    .toList();
            List<Bed> roomBeds = bedsByRoom.getOrDefault(room.getId(), List.of());
            int individualBeds = (int) roomBeds.stream().filter(b -> "INDIVIDUAL".equals(b.getBedType())).count();
            int matrimonioBeds = (int) roomBeds.stream().filter(b -> "MATRIMONIO".equals(b.getBedType())).count();
            return new DayDistributionResponse.RoomWithGuests(
                    room.getId(), room.getName(), room.getFloor(), room.getBedCount(),
                    individualBeds, matrimonioBeds, guests);
        }).toList();

        List<DayDistributionResponse.GuestInfo> unassigned = present.stream()
                .filter(g -> !assignedGuestIds.contains(g.getId()))
                .map(g -> new DayDistributionResponse.GuestInfo(g.getId(), g.getFullName()))
                .toList();

        return new DayDistributionResponse(day, roomResults, unassigned);
    }

    @Transactional
    public void assign(LocalDate day, UUID guestId, UUID roomId) {
        assignmentRepo.findByDayAndGuestId(day, guestId).ifPresentOrElse(
                a -> {
                    a.setRoomId(roomId);
                    assignmentRepo.save(a);
                },
                () -> assignmentRepo.save(new RoomAssignment(day, guestId, roomId)));
    }

    @Transactional
    public void unassign(LocalDate day, UUID guestId) {
        assignmentRepo.deleteByDayAndGuestId(day, guestId);
    }
}
