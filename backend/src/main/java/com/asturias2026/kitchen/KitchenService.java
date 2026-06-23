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

        List<LocalDate> days = new ArrayList<>();
        LocalDate day = cfg.tripStart();
        while (day.isBefore(cfg.tripEnd())) {
            days.add(day);
            day = day.plusDays(1);
        }

        // Round-robin para cocinar: comida y cena rotando 1,2,3,4,1,2...
        int cookIdx = 0;
        // Contadores para equilibrar recogidas
        Map<Integer, Integer> totalTasks = new HashMap<>();
        for (int g = 1; g <= 4; g++) totalTasks.put(g, 0);

        List<DayScheduleResponse> schedule = new ArrayList<>();

        for (LocalDate d : days) {
            int comidaCook = (cookIdx % 4) + 1; cookIdx++;
            int cenaCook = (cookIdx % 4) + 1; cookIdx++;
            totalTasks.merge(comidaCook, 1, Integer::sum);
            totalTasks.merge(cenaCook, 1, Integer::sum);

            // Recogidas: el que menos tareas totales tenga, sin coincidir con el que cocina esa comida
            int desayunoClean = pickLeastBusy(totalTasks, Set.of());
            totalTasks.merge(desayunoClean, 1, Integer::sum);

            int comidaClean = pickLeastBusy(totalTasks, Set.of(comidaCook));
            totalTasks.merge(comidaClean, 1, Integer::sum);

            int cenaClean = pickLeastBusy(totalTasks, Set.of(cenaCook));
            totalTasks.merge(cenaClean, 1, Integer::sum);

            List<MealAssignment> dayMeals = List.of(
                    new MealAssignment("DESAYUNO", null, desayunoClean),
                    new MealAssignment("COMIDA", comidaCook, comidaClean),
                    new MealAssignment("CENA", cenaCook, cenaClean)
            );
            schedule.add(new DayScheduleResponse(d, dayMeals));
        }

        return schedule;
    }

    private int pickLeastBusy(Map<Integer, Integer> totalTasks, Set<Integer> excluded) {
        int best = -1;
        int bestCount = Integer.MAX_VALUE;
        for (int g = 1; g <= 4; g++) {
            if (excluded.contains(g)) continue;
            int count = totalTasks.get(g);
            if (count < bestCount) {
                bestCount = count;
                best = g;
            }
        }
        return best;
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
