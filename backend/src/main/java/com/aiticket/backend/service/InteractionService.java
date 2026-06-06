package com.aiticket.backend.service;

import com.aiticket.backend.domain.entity.Interaction;
import com.aiticket.backend.domain.entity.Ticket;
import com.aiticket.backend.dto.InteractionCreateDto;
import com.aiticket.backend.dto.InteractionResponseDto;
import com.aiticket.backend.domain.enums.InteractionAuthor;
import com.aiticket.backend.domain.enums.TicketStatus;
import com.aiticket.backend.exception.ResourceNotFoundException;
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
                .orElseThrow(() -> new ResourceNotFoundException("Chamado não encontrado: " + ticketId));

        Interaction interaction = Interaction.builder()
                .ticket(ticket)
                .author(dto.author())
                .authorName(dto.authorName() != null ? dto.authorName() : dto.author().name())
                .message(dto.message())
                .build();

        // A primeira resposta do atendente coloca o chamado em andamento
        if (dto.author() == InteractionAuthor.ATTENDANT && ticket.getStatus() == TicketStatus.ABERTO) {
            ticket.setStatus(TicketStatus.EM_ANDAMENTO);
        }
        ticket.getInteractions().add(interaction);

        Interaction savedInteraction = interactionRepository.saveAndFlush(interaction);
        return mapToResponseDto(savedInteraction);
    }

    @Transactional(readOnly = true)
    public List<InteractionResponseDto> getInteractionsByTicketId(UUID ticketId) {
        if (!ticketRepository.existsById(ticketId)) {
            throw new ResourceNotFoundException("Chamado não encontrado: " + ticketId);
        }
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
