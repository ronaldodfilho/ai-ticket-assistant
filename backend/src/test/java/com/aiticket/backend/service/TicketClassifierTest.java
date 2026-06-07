package com.aiticket.backend.service;

import com.aiticket.backend.domain.enums.TicketCategory;
import com.aiticket.backend.domain.enums.TicketPriority;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TicketClassifierTest {

    @Test
    void parseAcceptsPlainResponse() {
        assertThat(TicketClassifier.parse("FISCAL|ALTA|SUPORTE_ERP"))
                .contains(new TicketClassification(TicketCategory.FISCAL, TicketPriority.ALTA, "SUPORTE_ERP"));
    }

    @Test
    void parseToleratesExtraTextSpacesAndAccents() {
        assertThat(TicketClassifier.parse("Classificação:\n```\nti | média | infraestrutura\n```"))
                .contains(new TicketClassification(TicketCategory.TI, TicketPriority.MEDIA, "INFRAESTRUTURA"));
    }

    @Test
    void parseFallsBackToN1ForUnknownDepartment() {
        assertThat(TicketClassifier.parse("SISTEMA|BAIXA|JURIDICO"))
                .contains(new TicketClassification(TicketCategory.SISTEMA, TicketPriority.BAIXA, "SUPORTE_N1"));
    }

    @Test
    void parseRejectsInvalidResponse() {
        assertThat(TicketClassifier.parse("não sei classificar")).isEmpty();
        assertThat(TicketClassifier.parse("FOO|BAR|BAZ")).isEmpty();
        assertThat(TicketClassifier.parse(null)).isEmpty();
    }

    @Test
    void keywordClassifierDetectsCategoryAndPriority() {
        assertThat(KeywordClassifier.classify("Erro na NF-e", "A SEFAZ rejeitou a nota fiscal, faturamento parado"))
                .isEqualTo(new TicketClassification(TicketCategory.FISCAL, TicketPriority.URGENTE, "SUPORTE_ERP"));
        assertThat(KeywordClassifier.classify("Férias", "Dúvida sobre o saldo de férias"))
                .isEqualTo(new TicketClassification(TicketCategory.RH, TicketPriority.BAIXA, "RH"));
        assertThat(KeywordClassifier.classify("Olá", "Preciso de ajuda"))
                .isEqualTo(new TicketClassification(TicketCategory.OUTROS, TicketPriority.MEDIA, "SUPORTE_N1"));
    }
}
