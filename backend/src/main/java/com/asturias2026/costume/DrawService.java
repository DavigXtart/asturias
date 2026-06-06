package com.asturias2026.costume;

import com.asturias2026.common.ApiException;
import com.asturias2026.costume.dto.AdminPairsResponse;
import com.asturias2026.costume.dto.DrawResult;
import com.asturias2026.costume.dto.MyPairResponse;
import com.asturias2026.guest.Guest;
import com.asturias2026.guest.GuestRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class DrawService {

    private final CostumeDrawRepository drawRepo;
    private final CostumePairRepository pairRepo;
    private final CostumePairMemberRepository memberRepo;
    private final GuestRepository guestRepo;

    private static final List<String> PALETTE = List.of(
            "rojo", "azul", "verde", "amarillo", "morado",
            "naranja", "rosa", "cian", "lima", "fucsia");

    public DrawService(CostumeDrawRepository drawRepo, CostumePairRepository pairRepo,
                       CostumePairMemberRepository memberRepo, GuestRepository guestRepo) {
        this.drawRepo = drawRepo;
        this.pairRepo = pairRepo;
        this.memberRepo = memberRepo;
        this.guestRepo = guestRepo;
    }

    /**
     * Pure pairing algorithm: shuffles IDs, chunks into pairs.
     * If odd count, the last group becomes a trio.
     */
    public static List<List<UUID>> pair(List<UUID> ids, Random rnd) {
        List<UUID> copy = new ArrayList<>(ids);
        Collections.shuffle(copy, rnd);
        List<List<UUID>> groups = new ArrayList<>();
        for (int i = 0; i < copy.size() - 1; i += 2) {
            List<UUID> group = new ArrayList<>();
            group.add(copy.get(i));
            group.add(copy.get(i + 1));
            groups.add(group);
        }
        if (copy.size() % 2 != 0) {
            // Odd: merge last person into the last group (trio)
            if (!groups.isEmpty()) {
                groups.get(groups.size() - 1).add(copy.get(copy.size() - 1));
            } else {
                // Only 1 person
                groups.add(new ArrayList<>(List.of(copy.get(0))));
            }
        }
        return groups;
    }

    @Transactional
    public DrawResult runDraw() {
        // Relaunch replaces: delete all previous data
        memberRepo.deleteAll();
        pairRepo.deleteAll();
        drawRepo.deleteAll();

        List<UUID> ids = guestRepo.findByRegisteredTrue().stream().map(Guest::getId).toList();
        if (ids.size() < 2) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Se necesitan al menos 2 invitados registrados");
        }

        CostumeDraw draw = drawRepo.save(new CostumeDraw("DONE"));
        List<List<UUID>> groups = pair(new ArrayList<>(ids), new Random());

        for (int i = 0; i < groups.size(); i++) {
            CostumePair pairEntity = pairRepo.save(
                    new CostumePair(draw.getId(), i, PALETTE.get(i % PALETTE.size())));
            for (UUID gid : groups.get(i)) {
                memberRepo.save(new CostumePairMember(pairEntity.getId(), gid));
            }
        }

        return new DrawResult(draw.getId(), groups.size());
    }

    public MyPairResponse myPair(UUID guestId) {
        CostumePair pair = pairRepo.findPairOfGuest(guestId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                        "Aun no tienes pareja (se ha hecho el sorteo?)"));
        List<String> partners = memberRepo.findGuestNamesByPairExcluding(pair.getId(), guestId);
        return new MyPairResponse(pair.getBallColor(), partners);
    }

    public List<AdminPairsResponse> allPairs() {
        // Get the latest draw
        List<CostumeDraw> draws = drawRepo.findAll();
        if (draws.isEmpty()) {
            return List.of();
        }
        CostumeDraw draw = draws.get(draws.size() - 1);
        List<CostumePair> pairs = pairRepo.findByDrawIdOrderByGroupIndex(draw.getId());
        return pairs.stream().map(p -> {
            List<String> members = memberRepo.findByPairId(p.getId()).stream()
                    .map(m -> guestRepo.findById(m.getGuestId())
                            .map(Guest::getFullName).orElse("?"))
                    .toList();
            return new AdminPairsResponse(p.getGroupIndex(), p.getBallColor(), members);
        }).toList();
    }
}
