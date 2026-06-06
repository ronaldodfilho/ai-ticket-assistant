package com.aiticket.backend.service;

import com.aiticket.backend.domain.entity.Interaction;
import com.aiticket.backend.domain.entity.Ticket;
import com.aiticket.backend.domain.enums.InteractionAuthor;
import com.aiticket.backend.domain.enums.TicketStatus;
import com.aiticket.backend.dto.TicketCreateDto;
import com.aiticket.backend.dto.TicketResponseDto;
import com.aiticket.backend.exception.ResourceNotFoundException;
import com.aiticket.backend.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {

    private final TicketRepository ticketRepository;
    private final AiIntegrationService aiService;
    private final TicketClassifier classifier;

    @Transactional
    public TicketResponseDto createTicket(TicketCreateDto dto) {
        Ticket ticket = Ticket.builder()
                .title(dto.title())
                .description(dto.description())
                .userName(dto.userName() != null ? dto.userName() : "Anonymous User")
                .status(TicketStatus.ABERTO)
                .build();

        Interaction initialInteraction = Interaction.builder()
                .ticket(ticket)
                .author(InteractionAuthor.USER)
                .authorName(ticket.getUserName())
                .message(dto.description())
                .build();

        ticket.getInteractions().add(initialInteraction);

        TicketClassification classification = classifier.classify(dto.title(), dto.description());
        ticket.setCategory(classification.category());
        ticket.setPriority(classification.priority());
        ticket.setDepartment(classification.department());

        Ticket savedTicket = ticketRepository.saveAndFlush(ticket);
        return mapToResponseDto(savedTicket);
    }

    @Transactional(readOnly = true)
    public List<TicketResponseDto> getAllTickets() {
        return ticketRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TicketResponseDto getTicket(UUID id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chamado não encontrado: " + id));
        return mapToResponseDto(ticket);
    }

    @Transactional
    public TicketResponseDto updateStatus(UUID id, TicketStatus status) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chamado não encontrado: " + id));
        ticket.setStatus(status);
        return mapToResponseDto(ticketRepository.saveAndFlush(ticket));
    }

    @Transactional(readOnly = true)
    public String summarizeTicket(UUID id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chamado não encontrado: " + id));
        
        StringBuilder history = new StringBuilder();
        for (Interaction interaction : ticket.getInteractions()) {
            history.append(interaction.getAuthorName()).append(": ").append(interaction.getMessage()).append("\n");
        }
        
        String prompt = "Por favor, faça um resumo conciso (máximo 3 frases) do histórico deste chamado de suporte para que um novo atendente possa entender rapidamente o problema atual:\n\n" + history;
        return aiService.generateContent(prompt).orElseGet(() -> localSummary(ticket));
    }

    @Transactional(readOnly = true)
    public String suggestResponse(UUID id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chamado não encontrado: " + id));
        
        StringBuilder history = new StringBuilder();
        for (Interaction interaction : ticket.getInteractions()) {
            history.append(interaction.getAuthorName()).append(": ").append(interaction.getMessage()).append("\n");
        }
        
        String prompt = "Com base no histórico deste chamado de suporte, gere uma resposta profissional, educada e útil que o atendente de suporte poderia enviar ao cliente agora. Seja direto ao ponto e responda apenas com o texto da mensagem. Histórico:\n\n" + history;
        return aiService.generateContent(prompt).orElseGet(() -> localSuggestion(ticket));
    }

    private String localSummary(Ticket ticket) {
        List<Interaction> interactions = ticket.getInteractions();
        StringBuilder summary = new StringBuilder()
                .append(ticket.getUserName()).append(" relatou: \"").append(ticket.getTitle()).append("\". ")
                .append("Chamado classificado como ").append(humanize(ticket.getCategory()))
                .append(", prioridade ").append(humanize(ticket.getPriority()))
                .append(", status atual ").append(humanize(ticket.getStatus())).append(". ");
        if (interactions.size() > 1) {
            Interaction last = interactions.get(interactions.size() - 1);
            summary.append("Há ").append(interactions.size()).append(" mensagens; a última, de ")
                    .append(last.getAuthorName()).append(", diz: \"").append(abbreviate(last.getMessage(), 160)).append("\".");
        } else {
            summary.append("Ainda não houve resposta do suporte.");
        }
        return summary.toString();
    }

    private String localSuggestion(Ticket ticket) {
        return "Olá, " + ticket.getUserName() + "! Recebemos seu chamado \"" + ticket.getTitle()
                + "\" e ele já está com a nossa equipe de " + humanize(ticket.getDepartment())
                + ". Estamos analisando o caso e retornaremos em breve com uma solução. "
                + "Se puder, envie prints ou mais detalhes que ajudem a reproduzir o problema.";
    }

    private static String humanize(Object value) {
        if (value == null) {
            return "—";
        }
        String text = value.toString();
        return switch (text) {
            case "TI", "RH", "SUPORTE_N1", "SUPORTE_ERP" -> text.replace("_", " ").replace("SUPORTE", "Suporte");
            case "MEDIA" -> "média";
            default -> text.replace("_", " ").toLowerCase(java.util.Locale.ROOT);
        };
    }

    private static String abbreviate(String text, int max) {
        return text.length() <= max ? text : text.substring(0, max - 1) + "…";
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
