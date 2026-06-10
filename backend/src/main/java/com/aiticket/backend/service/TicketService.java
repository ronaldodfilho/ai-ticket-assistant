package com.aiticket.backend.service;

import com.aiticket.backend.domain.entity.Interaction;
import com.aiticket.backend.domain.entity.Ticket;
import com.aiticket.backend.domain.enums.InteractionAuthor;
import com.aiticket.backend.domain.enums.TicketStatus;
import com.aiticket.backend.dto.TicketClassificationUpdateDto;
import com.aiticket.backend.dto.TicketCreateDto;
import com.aiticket.backend.dto.TicketResponseDto;
import com.aiticket.backend.exception.ResourceNotFoundException;
import com.aiticket.backend.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TicketService {

    static final String DEFAULT_USER_NAME = "Cliente";

    private final TicketRepository ticketRepository;
    private final AiIntegrationService aiService;
    private final TicketClassifier classifier;

    /**
     * Sem @Transactional de propósito: a classificação pode chamar a IA e levar alguns
     * segundos, e não faz sentido manter uma transação aberta durante a chamada HTTP.
     * O save abaixo roda na própria transação do repositório.
     */
    public TicketResponseDto createTicket(TicketCreateDto dto) {
        String title = dto.title().trim();
        String description = dto.description().trim();
        String userName = dto.userName() == null || dto.userName().isBlank() ? DEFAULT_USER_NAME : dto.userName().trim();

        TicketClassification classification = classifier.classify(title, description);

        Ticket ticket = Ticket.builder()
                .title(title)
                .description(description)
                .userName(userName)
                .status(TicketStatus.ABERTO)
                .category(classification.category())
                .priority(classification.priority())
                .department(classification.department())
                .build();

        ticket.getInteractions().add(Interaction.builder()
                .ticket(ticket)
                .author(InteractionAuthor.USER)
                .authorName(userName)
                .message(description)
                .build());

        return mapToResponseDto(ticketRepository.saveAndFlush(ticket));
    }

    @Transactional(readOnly = true)
    public List<TicketResponseDto> getAllTickets() {
        return ticketRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(TicketService::mapToResponseDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public TicketResponseDto getTicket(UUID id) {
        return mapToResponseDto(findTicket(id));
    }

    @Transactional
    public TicketResponseDto updateStatus(UUID id, TicketStatus status) {
        Ticket ticket = findTicket(id);
        ticket.setStatus(status);
        return mapToResponseDto(ticketRepository.saveAndFlush(ticket));
    }

    @Transactional
    public TicketResponseDto updateClassification(UUID id, TicketClassificationUpdateDto dto) {
        Ticket ticket = findTicket(id);
        ticket.setCategory(dto.category());
        ticket.setPriority(dto.priority());
        ticket.setDepartment(dto.department());
        return mapToResponseDto(ticketRepository.saveAndFlush(ticket));
    }

    public String summarizeTicket(UUID id) {
        Ticket ticket = loadWithHistory(id);
        String prompt = """
                Faça um resumo conciso, em no máximo 3 frases, do histórico deste chamado de suporte,
                para que um novo atendente entenda rapidamente o problema e a situação atual.
                Responda apenas com o resumo, em português.

                Título: %s
                Status: %s

                Histórico:
                %s""".formatted(ticket.getTitle(), humanize(ticket.getStatus()), formatHistory(ticket));
        return aiService.generateContent(prompt).orElseGet(() -> localSummary(ticket));
    }

    public String suggestResponse(UUID id) {
        Ticket ticket = loadWithHistory(id);
        String prompt = """
                Você é um atendente de suporte. Com base no histórico abaixo, escreva a próxima mensagem
                para o cliente: profissional, educada, útil e direta. Responda apenas com o texto da
                mensagem, em português, sem assinatura.

                Título: %s

                Histórico:
                %s""".formatted(ticket.getTitle(), formatHistory(ticket));
        return aiService.generateContent(prompt).orElseGet(() -> localSuggestion(ticket));
    }

    /** Carrega o chamado e o histórico numa transação curta, antes de chamar a IA. */
    private Ticket loadWithHistory(UUID id) {
        Ticket ticket = ticketRepository.findWithInteractionsById(id)
                .orElseThrow(() -> notFound(id));
        ticket.getInteractions().size();
        return ticket;
    }

    private Ticket findTicket(UUID id) {
        return ticketRepository.findById(id).orElseThrow(() -> notFound(id));
    }

    private static ResourceNotFoundException notFound(UUID id) {
        return new ResourceNotFoundException("Chamado não encontrado: " + id);
    }

    private static String formatHistory(Ticket ticket) {
        StringBuilder history = new StringBuilder();
        for (Interaction interaction : ticket.getInteractions()) {
            String role = interaction.getAuthor() == InteractionAuthor.USER ? "Cliente" : "Suporte";
            history.append("[").append(role).append("] ").append(interaction.getAuthorName())
                    .append(": ").append(interaction.getMessage()).append("\n");
        }
        return history.toString();
    }

    private static String localSummary(Ticket ticket) {
        List<Interaction> interactions = ticket.getInteractions();
        StringBuilder summary = new StringBuilder()
                .append(ticket.getUserName()).append(" relatou: \"").append(ticket.getTitle()).append("\". ")
                .append("Chamado classificado como ").append(humanize(ticket.getCategory()))
                .append(", prioridade ").append(humanize(ticket.getPriority()))
                .append(", status atual ").append(humanize(ticket.getStatus())).append(". ");
        if (interactions.size() > 1) {
            Interaction last = interactions.getLast();
            summary.append("São ").append(interactions.size()).append(" mensagens; a última, de ")
                    .append(last.getAuthorName()).append(", diz: \"").append(abbreviate(last.getMessage(), 160)).append("\".");
        } else {
            summary.append("Ainda não houve resposta do suporte.");
        }
        return summary.toString();
    }

    private static String localSuggestion(Ticket ticket) {
        return "Olá, " + ticket.getUserName() + "! Recebemos seu chamado \"" + ticket.getTitle()
                + "\" e ele já está com a nossa equipe de " + humanize(ticket.getDepartment())
                + ". Estamos analisando o caso e retornaremos em breve com uma solução. "
                + "Se puder, envie prints ou mais detalhes que ajudem a reproduzir o problema.";
    }

    static String humanize(Object value) {
        if (value == null) {
            return "—";
        }
        return switch (value.toString()) {
            case "TI" -> "TI";
            case "RH" -> "RH";
            case "SUPORTE_N1" -> "Suporte N1";
            case "SUPORTE_ERP" -> "Suporte ERP";
            case "MEDIA" -> "média";
            default -> value.toString().replace("_", " ").toLowerCase(Locale.ROOT);
        };
    }

    private static String abbreviate(String text, int max) {
        return text.length() <= max ? text : text.substring(0, max - 1) + "…";
    }

    static TicketResponseDto mapToResponseDto(Ticket ticket) {
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
