package com.aiticket.backend.service;

import com.aiticket.backend.domain.enums.TicketCategory;
import com.aiticket.backend.domain.enums.TicketDepartment;
import com.aiticket.backend.domain.enums.TicketPriority;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

class TicketClassifierTest {

    @Test
    void parseReadsJsonWithReason() {
        var result = TicketClassifier.parse("""
                {"categoria": "FISCAL", "prioridade": "URGENTE", "setor": "SUPORTE_ERP",
                 "motivo": "Faturamento parado por rejeição da SEFAZ."}""");

        assertThat(result).hasValueSatisfying(c -> {
            assertThat(c.category()).isEqualTo(TicketCategory.FISCAL);
            assertThat(c.priority()).isEqualTo(TicketPriority.URGENTE);
            assertThat(c.department()).isEqualTo(TicketDepartment.SUPORTE_ERP);
            assertThat(c.reason()).isEqualTo("Faturamento parado por rejeição da SEFAZ.");
        });
    }

    @Test
    void parseToleratesMarkdownAccentsAndLowercase() {
        var result = TicketClassifier.parse("""
                ```json
                {"categoria": "ti", "prioridade": "média", "setor": "infraestrutura", "motivo": "Lentidão com contorno."}
                ```""");

        assertThat(result).hasValueSatisfying(c -> {
            assertThat(c.category()).isEqualTo(TicketCategory.TI);
            assertThat(c.priority()).isEqualTo(TicketPriority.MEDIA);
            assertThat(c.department()).isEqualTo(TicketDepartment.INFRAESTRUTURA);
        });
    }

    @Test
    void parseForcesDefaultRoutingForUndefinedPriority() {
        var result = TicketClassifier.parse("""
                {"categoria": "FISCAL", "prioridade": "INDEFINIDA", "setor": "SUPORTE_ERP", "motivo": "Apenas saudação."}""");

        assertThat(result).hasValueSatisfying(c -> {
            assertThat(c.priority()).isEqualTo(TicketPriority.INDEFINIDA);
            assertThat(c.category()).isEqualTo(TicketCategory.OUTROS);
            assertThat(c.department()).isEqualTo(TicketDepartment.SUPORTE_N1);
        });
    }

    @Test
    void parseUsesDefaultsForUnknownCategoryAndMissingReason() {
        var result = TicketClassifier.parse("{\"categoria\": \"JURIDICO\", \"prioridade\": \"ALTA\", \"setor\": \"LEGAL\"}");

        assertThat(result).hasValueSatisfying(c -> {
            assertThat(c.category()).isEqualTo(TicketCategory.OUTROS);
            assertThat(c.department()).isEqualTo(TicketDepartment.SUPORTE_N1);
            assertThat(c.reason()).isNotBlank();
        });
    }

    @Test
    void parseRejectsResponsesWithoutValidPriority() {
        assertThat(TicketClassifier.parse("não sei classificar")).isEmpty();
        assertThat(TicketClassifier.parse("{\"prioridade\": \"ALTISSIMA\"}")).isEmpty();
        assertThat(TicketClassifier.parse(null)).isEmpty();
    }

    @ParameterizedTest(name = "{0} / {1} -> {2}")
    @CsvSource(delimiter = ';', textBlock = """
            Bom dia;                       bom dia;                                                         INDEFINIDA
            Oi;                            Preciso de ajuda por favor;                                     INDEFINIDA
            URGENTE;                       urgente!!!;                                                      INDEFINIDA
            Dúvida;                        Tenho uma dúvida;                                                INDEFINIDA
            Bom dia a todos;               Bom dia a todos, tudo bem?;                                      INDEFINIDA
            Erro na NF-e;                  A SEFAZ rejeitou a nota fiscal e o faturamento está parado;      URGENTE
            Sistema fora do ar;            Ninguém consegue acessar o ERP;                                  URGENTE
            E-mail suspeito;               Cliquei num link e acho que é vírus;                             URGENTE
            Boleto;                        Não consigo gerar o boleto e ele vence hoje;                     URGENTE
            VPN;                           Não consigo conectar na VPN de casa;                             ALTA
            Relatório urgente;             Preciso do relatório de vendas, é urgente;                       ALTA
            Sistema lento;                 O ERP está lento às vezes, mas funciona;                         MEDIA
            Impressora;                    A impressora do segundo andar está manchando as folhas;          MEDIA
            Férias;                        Dúvida sobre como consultar o saldo de férias;                   BAIXA
            Sugestão;                      Gostaria de sugerir uma melhoria no relatório de estoque;        BAIXA
            """)
    void keywordClassifierAppliesPriorityCriteria(String title, String description, TicketPriority expected) {
        TicketClassification result = KeywordClassifier.classify(title, description);

        assertThat(result.priority()).isEqualTo(expected);
        assertThat(result.reason()).isNotBlank();
    }

    @Test
    void keywordReasonCitesTheEvidence() {
        var result = KeywordClassifier.classify("Erro na NF-e", "A SEFAZ rejeitou a nota fiscal, faturamento parado");

        assertThat(result.category()).isEqualTo(TicketCategory.FISCAL);
        assertThat(result.department()).isEqualTo(TicketDepartment.SUPORTE_ERP);
        assertThat(result.reason()).startsWith("Urgente:").contains("parado");
    }

    @Test
    void undefinedReasonAsksForDetails() {
        var result = KeywordClassifier.classify("Bom dia", "Bom dia!");

        assertThat(result.category()).isEqualTo(TicketCategory.OUTROS);
        assertThat(result.department()).isEqualTo(TicketDepartment.SUPORTE_N1);
        assertThat(result.reason()).contains("detalhes");
    }
}
