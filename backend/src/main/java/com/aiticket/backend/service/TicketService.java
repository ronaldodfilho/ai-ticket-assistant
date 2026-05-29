package com.aiticket.backend.service;

import com.aiticket.backend.domain.entity.Interaction;
import com.aiticket.backend.domain.entity.Ticket;
import com.aiticket.backend.domain.enums.InteractionAuthor;
import com.aiticket.backend.domain.enums.TicketStatus;
import com.aiticket.backend.dto.InteractionCreateDto;
import com.aiticket.backend.dto.TicketCreateDto;
import com.aiticket.backend.dto.TicketResponseDto;
import com.aiticket.backend.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;

    @Transactional
    public TicketResponseDto createTicket(TicketCreateDto dto) {
        Ticket ticket = Ticket.builder()
                .title(dto.title())
                .description(dto.description())
                .userName(dto.userName() != null ? dto.userName() : "Anonymous User")
                .status(TicketStatus.ABERTO)
                .build();

        // Create initial interaction for the ticket description
        Interaction initialInteraction = Interaction.builder()
                .ticket(ticket)
                .author(InteractionAuthor.USER)
                .authorName(ticket.getUserName())
                .message(dto.description())
                .build();

        ticket.getInteractions().add(initialInteraction);

        Ticket savedTicket = ticketRepository.save(ticket);
        
        // TODO: Trigger AI classification asynchronously or synchronously here
        
        return mapToResponseDto(savedTicket);
    }

    @Transactional(readOnly = true)
    public List<TicketResponseDto> getAllTickets() {
        return ticketRepository.findAll().stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TicketResponseDto getTicket(UUID id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        return mapToResponseDto(ticket);
    }

    public TicketResponseDto mapToResponseDto(Ticket ticket) {
        return TicketResponseDto.builder()
                .id(ticket.getId())
                .title(ticket.getTitle())
                .description(ticket.getDescription())
                .category(ticket.getCategory())
                .priority(ticket.getPriority())
                .status(ticket.getStatus())
                .department(ticket.getDepartment())
                .userName(ticket.getUserName())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .build();
    }
}
