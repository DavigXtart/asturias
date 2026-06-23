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

        String[] meals = {"DESAYUNO", "COMIDA", "CENA"};
        // Desayuno es mucho más fácil que comida/cena
        Map<String, Integer> mealWeight = Map.of("DESAYUNO", 1, "COMIDA", 3, "CENA", 3);

        // Collect all days
        List<LocalDate> days = new ArrayList<>();
        LocalDate day = cfg.tripStart();
        while (day.isBefore(cfg.tripEnd())) {
            days.add(day);
            day = day.plusDays(1);
        }

        // Track weighted workload per group
        Map<Integer, Integer> totalWorkload = new HashMap<>();
        for (int g = 1; g <= 4; g++) totalWorkload.put(g, 0);

        List<DayScheduleResponse> schedule = new ArrayList<>();

        for (LocalDate d : days) {
            Map<Integer, Integer> presence = buildPresenceMap(d, allMembers, guestMap);
            Set<Integer> assignedToday = new HashSet<>();
            List<MealAssignment> dayMeals = new ArrayList<>();

            for (String meal : meals) {
                int bestGroup = -1;
                int bestScore = Integer.MIN_VALUE;
                int weight = mealWeight.get(meal);

                for (int g = 1; g <= 4; g++) {
                    int presenceCount = presence.getOrDefault(g, 0);
                    int score = presenceCount * 10
                            - totalWorkload.get(g);
                    if (assignedToday.contains(g)) {
                        score -= 1000;
                    }
                    if (score > bestScore || (score == bestScore && g < bestGroup)) {
                        bestScore = score;
                        bestGroup = g;
                    }
                }

                dayMeals.add(new MealAssignment(meal, bestGroup));
                assignedToday.add(bestGroup);
                totalWorkload.merge(bestGroup, weight, Integer::sum);
            }

            schedule.add(new DayScheduleResponse(d, dayMeals));
        }

        return schedule;
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
