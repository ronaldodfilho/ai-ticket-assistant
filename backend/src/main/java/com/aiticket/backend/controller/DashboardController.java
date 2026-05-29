package com.aiticket.backend.controller;

import com.aiticket.backend.domain.enums.TicketStatus;
import com.aiticket.backend.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DashboardController {

    private final TicketRepository ticketRepository;

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        long totalTickets = ticketRepository.count();
        // Fallback or exact query using spring data could be added
        // For simplicity, we fetch all and calculate in memory for MVP
        var allTickets = ticketRepository.findAll();
        
        long openTickets = allTickets.stream().filter(t -> t.getStatus() == TicketStatus.ABERTO).count();
        long resolvedTickets = allTickets.stream().filter(t -> t.getStatus() == TicketStatus.RESOLVIDO).count();
        long inProgressTickets = allTickets.stream().filter(t -> t.getStatus() == TicketStatus.EM_ANDAMENTO).count();

        return Map.of(
                "totalTickets", totalTickets,
                "openTickets", openTickets,
                "resolvedTickets", resolvedTickets,
                "inProgressTickets", inProgressTickets
        );
    }
}
