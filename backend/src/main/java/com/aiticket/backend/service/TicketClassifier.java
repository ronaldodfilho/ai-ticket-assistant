package com.aiticket.backend.service;

import com.aiticket.backend.domain.enums.TicketCategory;
import com.aiticket.backend.domain.enums.TicketDepartment;
import com.aiticket.backend.domain.enums.TicketPriority;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
@Slf4j
public class TicketClassifier {

    static final String PROMPT = """
            Você faz a triagem de chamados de um help desk corporativo.

            Título: %s
            Descrição: %s

            Defina a PRIORIDADE pelos critérios abaixo, avaliando impacto, bloqueio, prazo e segurança:
            - URGENTE: operação parada, várias pessoas ou a empresa inteira afetadas, incidente de segurança
              (vírus, invasão, vazamento de dados) ou bloqueio total em processo fiscal/financeiro com prazo no mesmo dia.
            - ALTA: uma pessoa ou equipe impedida de trabalhar, sem alternativa, ou prazo próximo.
            - MEDIA: problema real, mas com alternativa de contorno, lentidão ou falha intermitente.
            - BAIXA: dúvida, pedido de informação, sugestão ou melhoria, sem impacto imediato.
            - INDEFINIDA: a mensagem não descreve um problema (só saudação como "bom dia", "oi", "preciso de ajuda",
              teste ou texto sem contexto) e não dá para avaliar o impacto.
            A palavra "urgente" escrita pelo cliente, sozinha, não define a prioridade: avalie o impacto descrito.

            Opções de CATEGORIA: FISCAL, TI, RH, FINANCEIRO, SISTEMA, OUTROS.
            Opções de SETOR: SUPORTE_N1, SUPORTE_ERP, INFRAESTRUTURA, RH, FINANCEIRO.
            Se a prioridade for INDEFINIDA, use categoria OUTROS e setor SUPORTE_N1.

            Responda APENAS com um JSON, sem markdown, neste formato:
            {"categoria": "...", "prioridade": "...", "setor": "...", "motivo": "..."}
            O "motivo" deve ser uma frase curta em português (até 200 caracteres) explicando a prioridade
            com base no que o cliente escreveu.
            """;

    private static final Pattern FIELD = Pattern.compile("\"(categoria|prioridade|setor|motivo)\"\\s*:\\s*\"((?:[^\"\\\\]|\\\\.)*)\"",
            Pattern.CASE_INSENSITIVE);

    private final AiIntegrationService aiService;

    public TicketClassification classify(String title, String description) {
        if (aiService.isEnabled()) {
            Optional<TicketClassification> fromAi = aiService.generateContent(PROMPT.formatted(title, description))
                    .flatMap(TicketClassifier::parse);
            if (fromAi.isPresent()) {
                return fromAi.get();
            }
            log.warn("Classificação da IA indisponível ou não reconhecida, usando classificação local.");
        }
        return KeywordClassifier.classify(title, description);
    }

    /** Lê o JSON devolvido pela IA, tolerando texto ou markdown em volta e acentos nos valores. */
    static Optional<TicketClassification> parse(String aiResponse) {
        if (aiResponse == null) {
            return Optional.empty();
        }
        String category = null, priority = null, department = null, reason = null;
        Matcher matcher = FIELD.matcher(aiResponse);
        while (matcher.find()) {
            String value = matcher.group(2).replace("\\\"", "\"").trim();
            switch (matcher.group(1).toLowerCase(Locale.ROOT)) {
                case "categoria" -> category = value;
                case "prioridade" -> priority = value;
                case "setor" -> department = value;
                case "motivo" -> reason = value;
                default -> { }
            }
        }
        try {
            TicketPriority parsedPriority = TicketPriority.valueOf(toEnumName(priority));
            TicketCategory parsedCategory = parseOr(TicketCategory.class, category, TicketCategory.OUTROS);
            TicketDepartment parsedDepartment = parseOr(TicketDepartment.class, department, TicketDepartment.SUPORTE_N1);
            if (parsedPriority == TicketPriority.INDEFINIDA) {
                parsedCategory = TicketCategory.OUTROS;
                parsedDepartment = TicketDepartment.SUPORTE_N1;
            }
            String finalReason = reason == null || reason.isBlank() ? "Prioridade definida pela IA." : reason;
            return Optional.of(new TicketClassification(parsedCategory, parsedPriority, parsedDepartment, finalReason));
        } catch (IllegalArgumentException | NullPointerException e) {
            return Optional.empty();
        }
    }

    private static <E extends Enum<E>> E parseOr(Class<E> type, String value, E fallback) {
        try {
            return Enum.valueOf(type, toEnumName(value));
        } catch (IllegalArgumentException | NullPointerException e) {
            return fallback;
        }
    }

    private static String toEnumName(String value) {
        return stripAccents(value).trim().toUpperCase(Locale.ROOT).replace(' ', '_');
    }

    static String stripAccents(String text) {
        return Normalizer.normalize(text, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
    }
}
