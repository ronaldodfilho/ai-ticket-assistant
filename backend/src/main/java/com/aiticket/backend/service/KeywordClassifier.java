package com.aiticket.backend.service;

import com.aiticket.backend.domain.enums.TicketCategory;
import com.aiticket.backend.domain.enums.TicketPriority;

import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Classificação local por palavras-chave, usada quando a IA não está
 * configurada ou não responde.
 */
final class KeywordClassifier {

    private record Rule(TicketCategory category, String department, List<String> keywords) {}

    private static final List<Rule> RULES = List.of(
            new Rule(TicketCategory.FISCAL, "SUPORTE_ERP",
                    List.of("nota fiscal", "nf-e", "nfe", "nfs", "sefaz", "icms", "imposto", "tributo", "fiscal", "xml", "danfe", "cfop")),
            new Rule(TicketCategory.FINANCEIRO, "FINANCEIRO",
                    List.of("boleto", "pagamento", "fatura", "cobranca", "reembolso", "financeiro", "conta a pagar", "conta a receber", "pix", "cartao")),
            new Rule(TicketCategory.RH, "RH",
                    List.of("ferias", "salario", "holerite", "contracheque", "ponto", "beneficio", "admissao", "demissao", "rh", "folha")),
            new Rule(TicketCategory.SISTEMA, "SUPORTE_ERP",
                    List.of("erp", "sistema", "modulo", "relatorio", "tela", "cadastro", "erro ao salvar", "lancamento", "bug")),
            new Rule(TicketCategory.TI, "INFRAESTRUTURA",
                    List.of("internet", "rede", "wifi", "wi-fi", "vpn", "impressora", "computador", "notebook", "senha", "email", "e-mail", "servidor", "acesso", "monitor", "teclado"))
    );

    private static final Map<TicketPriority, List<String>> PRIORITY_KEYWORDS = Map.of(
            TicketPriority.URGENTE, List.of("urgente", "parado", "parou", "fora do ar", "caiu", "critico", "emergencia", "ninguem consegue", "producao"),
            TicketPriority.ALTA, List.of("nao consigo", "erro", "falha", "bloqueado", "travado", "prazo", "hoje"),
            TicketPriority.BAIXA, List.of("duvida", "sugestao", "quando possivel", "melhoria", "gostaria")
    );

    private KeywordClassifier() {}

    static TicketClassification classify(String title, String description) {
        String text = normalize(title + " " + description);

        Rule best = null;
        int bestScore = 0;
        for (Rule rule : RULES) {
            int score = 0;
            for (String keyword : rule.keywords()) {
                if (containsWord(text, keyword)) {
                    score++;
                }
            }
            if (score > bestScore) {
                best = rule;
                bestScore = score;
            }
        }

        TicketPriority priority = TicketPriority.MEDIA;
        for (TicketPriority candidate : List.of(TicketPriority.URGENTE, TicketPriority.ALTA, TicketPriority.BAIXA)) {
            if (PRIORITY_KEYWORDS.get(candidate).stream().anyMatch(k -> containsWord(text, k))) {
                priority = candidate;
                break;
            }
        }

        if (best == null) {
            return new TicketClassification(TicketCategory.OUTROS, priority, "SUPORTE_N1");
        }
        return new TicketClassification(best.category(), priority, best.department());
    }

    private static boolean containsWord(String text, String keyword) {
        return (" " + text + " ").contains(" " + keyword + " ")
                || (keyword.contains(" ") && text.contains(keyword));
    }

    private static String normalize(String text) {
        return TicketClassifier.stripAccents(text == null ? "" : text)
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\- ]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }
}
