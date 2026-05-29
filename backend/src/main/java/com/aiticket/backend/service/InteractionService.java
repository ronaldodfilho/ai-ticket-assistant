package com.aiticket.backend.service;

import com.aiticket.backend.domain.entity.Interaction;
import com.aiticket.backend.domain.entity.Ticket;
import com.aiticket.backend.dto.InteractionCreateDto;
import com.aiticket.backend.dto.InteractionResponseDto;
import com.aiticket.backend.repository.InteractionRepository;
import com.aiticket.backend.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InteractionService {

    private final InteractionRepository interactionRepository;
    private final TicketRepository ticketRepository;

    @Transactional
    public InteractionResponseDto addInteraction(UUID ticketId, InteractionCreateDto dto) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        Interaction interaction = Interaction.builder()
                .ticket(ticket)
                .author(dto.author())
                .authorName(dto.authorName() != null ? dto.authorName() : dto.author().name())
                .message(dto.message())
                .build();

        Interaction savedInteraction = interactionRepository.save(interaction);
        return mapToResponseDto(savedInteraction);
    }

    @Transactional(readOnly = true)
    public List<InteractionResponseDto> getInteractionsByTicketId(UUID ticketId) {
        return interactionRepository.findByTicketIdOrderByCreatedAtAsc(ticketId).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    public InteractionResponseDto mapToResponseDto(Interaction interaction) {
        return InteractionResponseDto.builder()
                .id(interaction.getId())
                .ticketId(interaction.getTicket().getId())
                .author(interaction.getAuthor())
                .authorName(interaction.getAuthorName())
                .message(interaction.getMessage())
                .createdAt(interaction.getCreatedAt())
                .build();
    }
}
