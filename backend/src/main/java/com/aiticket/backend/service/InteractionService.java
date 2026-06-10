package com.aiticket.backend.service;

import com.aiticket.backend.domain.entity.Interaction;
import com.aiticket.backend.domain.entity.Ticket;
import com.aiticket.backend.domain.enums.InteractionAuthor;
import com.aiticket.backend.domain.enums.TicketStatus;
import com.aiticket.backend.dto.InteractionCreateDto;
import com.aiticket.backend.dto.InteractionResponseDto;
import com.aiticket.backend.exception.BusinessRuleException;
import com.aiticket.backend.exception.ResourceNotFoundException;
import com.aiticket.backend.repository.InteractionRepository;
import com.aiticket.backend.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InteractionService {

    static final String DEFAULT_ATTENDANT_NAME = "Atendente";

    private final InteractionRepository interactionRepository;
    private final TicketRepository ticketRepository;

    @Transactional
    public InteractionResponseDto addInteraction(UUID ticketId, InteractionCreateDto dto) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Chamado não encontrado: " + ticketId));

        if (dto.author() == InteractionAuthor.SYSTEM_AI) {
            throw new BusinessRuleException("Mensagens só podem ser enviadas pelo cliente ou pelo atendente.");
        }
        if (ticket.getStatus() == TicketStatus.FECHADO) {
            throw new BusinessRuleException("Este chamado está fechado e não aceita novas mensagens.");
        }

        Interaction interaction = Interaction.builder()
                .ticket(ticket)
                .author(dto.author())
                .authorName(resolveAuthorName(ticket, dto))
                .message(dto.message().trim())
                .build();

        if (dto.author() == InteractionAuthor.ATTENDANT && ticket.getStatus() == TicketStatus.ABERTO) {
            // A primeira resposta do atendente coloca o chamado em andamento
            ticket.setStatus(TicketStatus.EM_ANDAMENTO);
        } else if (dto.author() == InteractionAuthor.USER && ticket.getStatus() == TicketStatus.RESOLVIDO) {
            // O cliente respondeu depois da solução: o problema não foi resolvido
            ticket.setStatus(TicketStatus.EM_ANDAMENTO);
        }
        // Mensagens novas contam como atividade no chamado
        ticket.setUpdatedAt(Instant.now());
        ticket.getInteractions().add(interaction);

        return mapToResponseDto(interactionRepository.saveAndFlush(interaction));
    }

    @Transactional(readOnly = true)
    public List<InteractionResponseDto> getInteractionsByTicketId(UUID ticketId) {
        if (!ticketRepository.existsById(ticketId)) {
            throw new ResourceNotFoundException("Chamado não encontrado: " + ticketId);
        }
        return interactionRepository.findByTicketIdOrderByCreatedAtAsc(ticketId).stream()
                .map(InteractionService::mapToResponseDto)
                .toList();
    }

    private static String resolveAuthorName(Ticket ticket, InteractionCreateDto dto) {
        if (dto.authorName() != null && !dto.authorName().isBlank()) {
            return dto.authorName().trim();
        }
        return dto.author() == InteractionAuthor.USER ? ticket.getUserName() : DEFAULT_ATTENDANT_NAME;
    }

    static InteractionResponseDto mapToResponseDto(Interaction interaction) {
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
