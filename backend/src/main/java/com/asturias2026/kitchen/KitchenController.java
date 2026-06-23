package com.asturias2026.kitchen;

import com.asturias2026.kitchen.dto.AssignMemberRequest;
import com.asturias2026.kitchen.dto.DayBalanceResponse;
import com.asturias2026.kitchen.dto.DayScheduleResponse;
import com.asturias2026.kitchen.dto.KitchenGroupResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class KitchenController {

    private final KitchenService service;

    public KitchenController(KitchenService service) {
        this.service = service;
    }

    @GetMapping("/kitchen/groups")
    public List<KitchenGroupResponse> listGroups() {
        return service.listGroups();
    }

    @PutMapping("/kitchen/groups/{groupNumber}/members")
    public KitchenGroupResponse assignMember(@PathVariable int groupNumber,
                                             @Valid @RequestBody AssignMemberRequest req) {
        return service.assignMember(groupNumber, req.guestId());
    }

    @DeleteMapping("/kitchen/groups/{groupNumber}/members/{guestId}")
    public void removeMember(@PathVariable int groupNumber, @PathVariable UUID guestId) {
        service.removeMember(groupNumber, guestId);
    }

    @GetMapping("/kitchen/balance")
    public List<DayBalanceResponse> getBalance() {
        return service.getBalance();
    }

    @GetMapping("/kitchen/schedule")
    public List<DayScheduleResponse> getSchedule() {
        return service.generateSchedule();
    }
}
