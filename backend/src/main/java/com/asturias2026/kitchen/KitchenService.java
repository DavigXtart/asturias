package com.asturias2026.kitchen;

import com.asturias2026.common.ApiException;
import com.asturias2026.config_.ConfigService;
import com.asturias2026.config_.dto.ConfigResponse;
import com.asturias2026.guest.Guest;
import com.asturias2026.guest.GuestRepository;
import com.asturias2026.kitchen.dto.DayBalanceResponse;
import com.asturias2026.kitchen.dto.DayScheduleResponse;
import com.asturias2026.kitchen.dto.KitchenGroupResponse;
import com.asturias2026.kitchen.dto.KitchenMemberResponse;
import com.asturias2026.kitchen.dto.MealAssignment;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class KitchenService {

    private final KitchenMemberRepository repo;
    private final GuestRepository guestRepo;
    private final ConfigService configService;

    public KitchenService(KitchenMemberRepository repo, GuestRepository guestRepo, ConfigService configService) {
        this.repo = repo;
        this.guestRepo = guestRepo;
        this.configService = configService;
    }

    public List<KitchenGroupResponse> listGroups() {
        List<KitchenMember> all = repo.findAll();
        Map<UUID, String> guestNames = guestRepo.findAll().stream()
                .collect(Collectors.toMap(Guest::getId, Guest::getFullName));

        List<KitchenGroupResponse> groups = new ArrayList<>();
        for (int g = 1; g <= 4; g++) {
            int groupNum = g;
            List<KitchenMemberResponse> members = all.stream()
                    .filter(m -> m.getGroupNumber() == groupNum)
                    .map(m -> new KitchenMemberResponse(
                            m.getGuestId(),
                            guestNames.getOrDefault(m.getGuestId(), "Desconocido")))
                    .toList();
            groups.add(new KitchenGroupResponse(groupNum, members));
        }
        return groups;
    }

    @Transactional
    public KitchenGroupResponse assignMember(int groupNumber, UUID guestId) {
        validateGroupNumber(groupNumber);
        guestRepo.findById(guestId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Invitado no encontrado"));

        Optional<KitchenMember> existing = repo.findByGuestId(guestId);
        if (existing.isPresent()) {
            KitchenMember member = existing.get();
            member.setGroupNumber(groupNumber);
            repo.save(member);
        } else {
            repo.save(new KitchenMember(groupNumber, guestId));
        }

        return getGroup(groupNumber);
    }

    @Transactional
    public void removeMember(int groupNumber, UUID guestId) {
        validateGroupNumber(groupNumber);
        KitchenMember member = repo.findByGroupNumberAndGuestId(groupNumber, guestId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Miembro no encontrado en este grupo"));
        repo.delete(member);
    }

    public List<DayBalanceResponse> getBalance() {
        ConfigResponse cfg = configService.get();
        List<KitchenMember> allMembers = repo.findAll();
        Map<UUID, Guest> guestMap = guestRepo.findAll().stream()
                .collect(Collectors.toMap(Guest::getId, g -> g));

        List<DayBalanceResponse> result = new ArrayList<>();
        LocalDate day = cfg.tripStart();
        while (day.isBefore(cfg.tripEnd())) {
            result.add(new DayBalanceResponse(day, buildPresenceMap(day, allMembers, guestMap)));
            day = day.plusDays(1);
        }
        return result;
    }

    public List<DayScheduleResponse> generateSchedule() {
        ConfigResponse cfg = configService.get();
        List<KitchenMember> allMembers = repo.findAll();
        Map<UUID, Guest> guestMap = guestRepo.findAll().stream()
                .collect(Collectors.toMap(Guest::getId, g -> g));

        // Pesos: cocinar es más esfuerzo que recoger, desayuno solo se recoge
        int COOK_WEIGHT = 3;
        int CLEAN_WEIGHT = 2;
        int BREAKFAST_CLEAN_WEIGHT = 1;

        List<LocalDate> days = new ArrayList<>();
        LocalDate day = cfg.tripStart();
        while (day.isBefore(cfg.tripEnd())) {
            days.add(day);
            day = day.plusDays(1);
        }

        Map<Integer, Integer> totalWorkload = new HashMap<>();
        for (int g = 1; g <= 4; g++) totalWorkload.put(g, 0);

        List<DayScheduleResponse> schedule = new ArrayList<>();

        for (LocalDate d : days) {
            Map<Integer, Integer> presence = buildPresenceMap(d, allMembers, guestMap);
            Set<Integer> busyToday = new HashSet<>();
            List<MealAssignment> dayMeals = new ArrayList<>();

            // --- DESAYUNO: solo recoge, nadie cocina ---
            int breakfastClean = pickBestGroup(presence, totalWorkload, busyToday);
            dayMeals.add(new MealAssignment("DESAYUNO", null, breakfastClean));
            busyToday.add(breakfastClean);
            totalWorkload.merge(breakfastClean, BREAKFAST_CLEAN_WEIGHT, Integer::sum);

            // --- COMIDA: uno cocina, otro recoge ---
            int comidaCook = pickBestGroup(presence, totalWorkload, busyToday);
            busyToday.add(comidaCook);
            totalWorkload.merge(comidaCook, COOK_WEIGHT, Integer::sum);

            int comidaClean = pickBestGroup(presence, totalWorkload, busyToday);
            busyToday.add(comidaClean);
            totalWorkload.merge(comidaClean, CLEAN_WEIGHT, Integer::sum);

            dayMeals.add(new MealAssignment("COMIDA", comidaCook, comidaClean));

            // --- CENA: uno cocina, otro recoge ---
            // Reset busy para cena: permitir reusar grupos (solo hay 4 y ya usamos 3)
            Set<Integer> busyForDinner = new HashSet<>();
            // El que cocina la cena no debería ser el mismo que cocinó la comida
            busyForDinner.add(comidaCook);

            int cenaCook = pickBestGroup(presence, totalWorkload, busyForDinner);
            busyForDinner.add(cenaCook);
            totalWorkload.merge(cenaCook, COOK_WEIGHT, Integer::sum);

            // El que recoge la cena no debería ser el que cocinó la cena
            Set<Integer> busyForDinnerClean = new HashSet<>(busyForDinner);
            int cenaClean = pickBestGroup(presence, totalWorkload, busyForDinnerClean);
            totalWorkload.merge(cenaClean, CLEAN_WEIGHT, Integer::sum);

            dayMeals.add(new MealAssignment("CENA", cenaCook, cenaClean));

            schedule.add(new DayScheduleResponse(d, dayMeals));
        }

        return schedule;
    }

    private int pickBestGroup(Map<Integer, Integer> presence, Map<Integer, Integer> workload, Set<Integer> excluded) {
        int bestGroup = -1;
        int bestScore = Integer.MIN_VALUE;
        for (int g = 1; g <= 4; g++) {
            int score = presence.getOrDefault(g, 0) * 10 - workload.get(g);
            if (excluded.contains(g)) {
                score -= 1000;
            }
            if (score > bestScore || (score == bestScore && g < bestGroup)) {
                bestScore = score;
                bestGroup = g;
            }
        }
        return bestGroup;
    }

    private Map<Integer, Integer> buildPresenceMap(LocalDate date, List<KitchenMember> allMembers, Map<UUID, Guest> guestMap) {
        Map<Integer, Integer> counts = new LinkedHashMap<>();
        for (int g = 1; g <= 4; g++) {
            counts.put(g, 0);
        }
        for (KitchenMember member : allMembers) {
            Guest guest = guestMap.get(member.getGuestId());
            if (guest != null && guest.isRegistered()
                    && guest.getArrivalDate() != null && guest.getDepartureDate() != null
                    && !guest.getArrivalDate().isAfter(date)
                    && guest.getDepartureDate().isAfter(date)) {
                counts.merge(member.getGroupNumber(), 1, Integer::sum);
            }
        }
        return counts;
    }

    private KitchenGroupResponse getGroup(int groupNumber) {
        Map<UUID, String> guestNames = guestRepo.findAll().stream()
                .collect(Collectors.toMap(Guest::getId, Guest::getFullName));
        List<KitchenMemberResponse> members = repo.findByGroupNumber(groupNumber).stream()
                .map(m -> new KitchenMemberResponse(
                        m.getGuestId(),
                        guestNames.getOrDefault(m.getGuestId(), "Desconocido")))
                .toList();
        return new KitchenGroupResponse(groupNumber, members);
    }

    private void validateGroupNumber(int groupNumber) {
        if (groupNumber < 1 || groupNumber > 4) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El grupo debe ser entre 1 y 4");
        }
    }
}
