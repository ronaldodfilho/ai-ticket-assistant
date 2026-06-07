package com.aiticket.backend.service;

import com.aiticket.backend.domain.enums.InteractionAuthor;
import com.aiticket.backend.domain.enums.TicketCategory;
import com.aiticket.backend.domain.enums.TicketStatus;
import com.aiticket.backend.dto.InteractionCreateDto;
import com.aiticket.backend.dto.TicketCreateDto;
import com.aiticket.backend.dto.TicketResponseDto;
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
        assertThat(interactionService.getInteractionsByTicketId(ticket.id())).hasSize(1);
    }

    @Test
    void attendantReplyMovesTicketToInProgress() {
        TicketResponseDto ticket = ticketService.createTicket(new TicketCreateDto("VPN", "A VPN não conecta", "Ana"));

        interactionService.addInteraction(ticket.id(),
                new InteractionCreateDto("Vamos verificar", InteractionAuthor.ATTENDANT, "João"));

        assertThat(ticketService.getTicket(ticket.id()).status()).isEqualTo(TicketStatus.EM_ANDAMENTO);
        assertThat(ticketService.summarizeTicket(ticket.id())).contains("Ana").contains("João");
        assertThat(ticketService.suggestResponse(ticket.id())).startsWith("Olá, Ana!");
    }

    @Test
    void updatesStatus() {
        TicketResponseDto ticket = ticketService.createTicket(new TicketCreateDto("Teste", "Teste", "Bia"));

        assertThat(ticketService.updateStatus(ticket.id(), TicketStatus.RESOLVIDO).status())
                .isEqualTo(TicketStatus.RESOLVIDO);
    }

    @Test
    void unknownTicketThrowsNotFound() {
        assertThatThrownBy(() -> ticketService.getTicket(UUID.randomUUID()))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
