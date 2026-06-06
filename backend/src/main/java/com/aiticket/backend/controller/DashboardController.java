package com.aiticket.backend.controller;

import com.aiticket.backend.domain.enums.TicketStatus;
import com.aiticket.backend.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final TicketRepository ticketRepository;

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        return Map.of(
                "totalTickets", ticketRepository.count(),
                "openTickets", ticketRepository.countByStatus(TicketStatus.ABERTO),
                "inProgressTickets", ticketRepository.countByStatus(TicketStatus.EM_ANDAMENTO),
                "resolvedTickets", ticketRepository.countByStatus(TicketStatus.RESOLVIDO),
                "closedTickets", ticketRepository.countByStatus(TicketStatus.FECHADO)
        );
    }
}
