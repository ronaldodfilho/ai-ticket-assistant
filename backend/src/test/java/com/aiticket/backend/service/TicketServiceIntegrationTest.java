package com.aiticket.backend.service;

import com.aiticket.backend.domain.enums.InteractionAuthor;
import com.aiticket.backend.domain.enums.TicketCategory;
import com.aiticket.backend.domain.enums.TicketDepartment;
import com.aiticket.backend.domain.enums.TicketPriority;
import com.aiticket.backend.domain.enums.TicketStatus;
import com.aiticket.backend.dto.InteractionCreateDto;
import com.aiticket.backend.dto.TicketClassificationUpdateDto;
import com.aiticket.backend.dto.TicketCreateDto;
import com.aiticket.backend.dto.TicketResponseDto;
import com.aiticket.backend.exception.BusinessRuleException;
import com.aiticket.backend.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest(properties = "gemini.api.key=")
class TicketServiceIntegrationTest {

    @Autowired
    private TicketService ticketService;

    @Autowired
    private InteractionService interactionService;

    @Test
    void createsAndClassifiesTicketWithoutApiKey() {
        TicketResponseDto ticket = ticketService.createTicket(
                new TicketCreateDto("Boleto não gerado", "Não consigo gerar o boleto do fornecedor", "Carlos"));

        assertThat(ticket.id()).isNotNull();
        assertThat(ticket.createdAt()).isNotNull();
        assertThat(ticket.status()).isEqualTo(TicketStatus.ABERTO);
        assertThat(ticket.category()).isEqualTo(TicketCategory.FINANCEIRO);
        assertThat(ticket.department()).isEqualTo(TicketDepartment.FINANCEIRO);
        assertThat(interactionService.getInteractionsByTicketId(ticket.id())).hasSize(1);
    }

    @Test
    void blankUserNameBecomesDefault() {
        TicketResponseDto ticket = ticketService.createTicket(new TicketCreateDto("  Dúvida  ", "Como faço?", "  "));

        assertThat(ticket.userName()).isEqualTo(TicketService.DEFAULT_USER_NAME);
        assertThat(ticket.title()).isEqualTo("Dúvida");
    }

    @Test
    void attendantReplyMovesTicketToInProgress() {
        TicketResponseDto ticket = ticketService.createTicket(new TicketCreateDto("VPN", "A VPN não conecta", "Ana"));

        interactionService.addInteraction(ticket.id(),
                new InteractionCreateDto("Vamos verificar", InteractionAuthor.ATTENDANT, "João"));

        TicketResponseDto updated = ticketService.getTicket(ticket.id());
        assertThat(updated.status()).isEqualTo(TicketStatus.EM_ANDAMENTO);
        assertThat(updated.updatedAt()).isAfter(ticket.updatedAt());
        assertThat(ticketService.summarizeTicket(ticket.id())).contains("Ana").contains("João");
        assertThat(ticketService.suggestResponse(ticket.id())).startsWith("Olá, Ana!");
    }

    @Test
    void customerReplyReopensResolvedTicket() {
        TicketResponseDto ticket = ticketService.createTicket(new TicketCreateDto("Impressora", "Não imprime", "Bia"));
        ticketService.updateStatus(ticket.id(), TicketStatus.RESOLVIDO);

        var reply = interactionService.addInteraction(ticket.id(),
                new InteractionCreateDto("Continua sem imprimir", InteractionAuthor.USER, null));

        assertThat(reply.authorName()).isEqualTo("Bia");
        assertThat(ticketService.getTicket(ticket.id()).status()).isEqualTo(TicketStatus.EM_ANDAMENTO);
    }

    @Test
    void closedTicketRejectsMessages() {
        TicketResponseDto ticket = ticketService.createTicket(new TicketCreateDto("Teste", "Teste", "Bia"));
        ticketService.updateStatus(ticket.id(), TicketStatus.FECHADO);

        assertThatThrownBy(() -> interactionService.addInteraction(ticket.id(),
                new InteractionCreateDto("Oi", InteractionAuthor.USER, null)))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void aiAuthorCannotBeUsedByClients() {
        TicketResponseDto ticket = ticketService.createTicket(new TicketCreateDto("Teste", "Teste", "Bia"));

        assertThatThrownBy(() -> interactionService.addInteraction(ticket.id(),
                new InteractionCreateDto("Oi", InteractionAuthor.SYSTEM_AI, null)))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void attendantCanCorrectClassification() {
        TicketResponseDto ticket = ticketService.createTicket(new TicketCreateDto("Olá", "Preciso de ajuda", "Bia"));

        TicketResponseDto updated = ticketService.updateClassification(ticket.id(),
                new TicketClassificationUpdateDto(TicketCategory.RH, TicketPriority.ALTA, TicketDepartment.RH));

        assertThat(updated.category()).isEqualTo(TicketCategory.RH);
        assertThat(updated.priority()).isEqualTo(TicketPriority.ALTA);
        assertThat(updated.department()).isEqualTo(TicketDepartment.RH);
    }

    @Test
    void unknownTicketThrowsNotFound() {
        assertThatThrownBy(() -> ticketService.getTicket(UUID.randomUUID()))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
