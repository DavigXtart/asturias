package com.asturias2026.costume;

import com.asturias2026.common.ApiException;
import com.asturias2026.costume.dto.AdminPairsResponse;
import com.asturias2026.costume.dto.BallsViewResponse;
import com.asturias2026.costume.dto.DrawResult;
import com.asturias2026.costume.dto.MyPairResponse;
import com.asturias2026.guest.Guest;
import com.asturias2026.guest.GuestRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class DrawService {

    private final CostumeDrawRepository drawRepo;
    private final CostumePairRepository pairRepo;
    private final CostumePairMemberRepository memberRepo;
    private final GuestRepository guestRepo;

    private static final List<String> PALETTE = List.of(
            "rojo", "azul", "verde", "amarillo", "morado",
            "naranja", "rosa", "cian", "lima", "fucsia");

    /** 25 visually distinct ball colors (hex) — one per person */
    private static final List<String> BALL_PALETTE = List.of(
            "#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7",
            "#f97316", "#ec4899", "#06b6d4", "#84cc16", "#d946ef",
            "#14b8a6", "#f43f5e", "#8b5cf6", "#0ea5e9", "#10b981",
            "#fbbf24", "#6366f1", "#78716c", "#dc2626", "#2563eb",
            "#16a34a", "#ca8a04", "#9333ea", "#e11d48", "#0891b2");

    public DrawService(CostumeDrawRepository drawRepo, CostumePairRepository pairRepo,
                       CostumePairMemberRepository memberRepo, GuestRepository guestRepo) {
        this.drawRepo = drawRepo;
        this.pairRepo = pairRepo;
        this.memberRepo = memberRepo;
        this.guestRepo = guestRepo;
    }

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
            if (!groups.isEmpty()) {
                groups.get(groups.size() - 1).add(copy.get(copy.size() - 1));
            } else {
                groups.add(new ArrayList<>(List.of(copy.get(0))));
            }
        }
        return groups;
    }

    @Transactional
    public DrawResult runDraw() {
        memberRepo.deleteAll();
        pairRepo.deleteAll();
        drawRepo.deleteAll();

        List<UUID> ids = guestRepo.findByRegisteredTrue().stream().map(Guest::getId).toList();
        if (ids.size() < 2) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Se necesitan al menos 2 invitados registrados");
        }

        CostumeDraw draw = drawRepo.save(new CostumeDraw("DONE"));
        List<List<UUID>> groups = pair(new ArrayList<>(ids), new Random());

        // Shuffle ball colors for unique per-person assignment
        List<String> shuffledBallColors = new ArrayList<>(BALL_PALETTE);
        Collections.shuffle(shuffledBallColors);

        int colorIdx = 0;
        for (int i = 0; i < groups.size(); i++) {
            CostumePair pairEntity = pairRepo.save(
                    new CostumePair(draw.getId(), i, PALETTE.get(i % PALETTE.size())));
            for (UUID gid : groups.get(i)) {
                String ballColor = shuffledBallColors.get(colorIdx % shuffledBallColors.size());
                memberRepo.save(new CostumePairMember(pairEntity.getId(), gid, ballColor));
                colorIdx++;
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

    public BallsViewResponse ballsView(UUID guestId) {
        // Find the user's member record to get their ball color
        CostumePair myPair = pairRepo.findPairOfGuest(guestId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Sorteo no realizado"));

        // Get user's ball color
        CostumePairMember myMember = memberRepo.findByPairId(myPair.getId()).stream()
                .filter(m -> m.getGuestId().equals(guestId))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No encontrado en el sorteo"));

        String myBallColor = myMember.getBallColor();

        // Get all pairs for the same draw
        List<CostumePair> allPairs = pairRepo.findByDrawIdOrderByGroupIndex(myPair.getDrawId());

        List<BallsViewResponse.BallPair> pairs = allPairs.stream().map(p -> {
            List<String> ballColors = memberRepo.findByPairId(p.getId()).stream()
                    .map(CostumePairMember::getBallColor)
                    .toList();
            return new BallsViewResponse.BallPair(ballColors);
        }).toList();

        return new BallsViewResponse(myBallColor, pairs);
    }

    public List<AdminPairsResponse> allPairs() {
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
