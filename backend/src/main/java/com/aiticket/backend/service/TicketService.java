package com.aiticket.backend.service;

import com.aiticket.backend.domain.entity.Interaction;
import com.aiticket.backend.domain.entity.Ticket;
import com.aiticket.backend.domain.enums.InteractionAuthor;
import com.aiticket.backend.domain.enums.TicketCategory;
import com.aiticket.backend.domain.enums.TicketPriority;
import com.aiticket.backend.domain.enums.TicketStatus;
import com.aiticket.backend.dto.TicketCreateDto;
import com.aiticket.backend.dto.TicketResponseDto;
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

        // Chamar IA para classificação
        try {
            String prompt = "Analise o seguinte chamado de suporte:\\n\\nTítulo: " + dto.title() + "\\nDescrição: " + dto.description() + "\\n\\nClassifique o chamado retornando APENAS uma string no seguinte formato: CATEGORIA|PRIORIDADE|SETOR.\\nOpções de CATEGORIA: FISCAL, TI, RH, FINANCEIRO, SISTEMA, OUTROS.\\nOpções de PRIORIDADE: BAIXA, MEDIA, ALTA, URGENTE.\\nOpções de SETOR: SUPORTE_N1, SUPORTE_ERP, INFRAESTRUTURA, RH, FINANCEIRO.";
            String aiClassification = aiService.generateContent(prompt);
            
            if (aiClassification != null && aiClassification.contains("|")) {
                String[] parts = aiClassification.split("\\\\|");
                if (parts.length >= 3) {
                    ticket.setCategory(TicketCategory.valueOf(parts[0].trim().toUpperCase()));
                    ticket.setPriority(TicketPriority.valueOf(parts[1].trim().toUpperCase()));
                    ticket.setDepartment(parts[2].trim());
                }
            } else {
                ticket.setCategory(TicketCategory.OUTROS);
                ticket.setPriority(TicketPriority.MEDIA);
                ticket.setDepartment("SUPORTE_N1");
            }
        } catch (Exception e) {
            log.error("Erro na classificação da IA, usando fallback.", e);
            ticket.setCategory(TicketCategory.OUTROS);
            ticket.setPriority(TicketPriority.MEDIA);
            ticket.setDepartment("SUPORTE_N1");
        }

        Ticket savedTicket = ticketRepository.save(ticket);
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

    @Transactional
    public String summarizeTicket(UUID id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        
        StringBuilder history = new StringBuilder();
        for (Interaction interaction : ticket.getInteractions()) {
            history.append(interaction.getAuthorName()).append(": ").append(interaction.getMessage()).append("\\n");
        }
        
        String prompt = "Por favor, faça um resumo conciso (máximo 3 frases) do histórico deste chamado de suporte para que um novo atendente possa entender rapidamente o problema atual:\\n\\n" + history.toString();
        return aiService.generateContent(prompt);
    }

    @Transactional
    public String suggestResponse(UUID id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        
        StringBuilder history = new StringBuilder();
        for (Interaction interaction : ticket.getInteractions()) {
            history.append(interaction.getAuthorName()).append(": ").append(interaction.getMessage()).append("\\n");
        }
        
        String prompt = "Com base no histórico deste chamado de suporte, gere uma resposta profissional, educada e útil que o atendente de suporte poderia enviar ao cliente agora. Seja direto ao ponto. Histórico:\\n\\n" + history.toString();
        return aiService.generateContent(prompt);
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
