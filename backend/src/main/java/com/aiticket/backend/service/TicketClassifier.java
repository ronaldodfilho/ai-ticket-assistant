package com.aiticket.backend.service;

import com.aiticket.backend.domain.enums.TicketCategory;
import com.aiticket.backend.domain.enums.TicketDepartment;
import com.aiticket.backend.domain.enums.TicketPriority;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
@Slf4j
public class TicketClassifier {

    private static final Pattern CLASSIFICATION_PATTERN =
            Pattern.compile("([A-Z_]+)\\s*\\|\\s*([A-Z_]+)\\s*\\|\\s*([A-Z_0-9]+)");

    private final AiIntegrationService aiService;

    public TicketClassification classify(String title, String description) {
        String prompt = """
                Analise o seguinte chamado de suporte:

                Título: %s
                Descrição: %s

                Classifique o chamado retornando APENAS uma linha no formato CATEGORIA|PRIORIDADE|SETOR, sem nenhum texto adicional.
                Opções de CATEGORIA: FISCAL, TI, RH, FINANCEIRO, SISTEMA, OUTROS.
                Opções de PRIORIDADE: BAIXA, MEDIA, ALTA, URGENTE.
                Opções de SETOR: SUPORTE_N1, SUPORTE_ERP, INFRAESTRUTURA, RH, FINANCEIRO.
                """.formatted(title, description);

        if (aiService.isEnabled()) {
            Optional<TicketClassification> fromAi = aiService.generateContent(prompt).flatMap(TicketClassifier::parse);
            if (fromAi.isPresent()) {
                return fromAi.get();
            }
            log.warn("Classificação da IA indisponível ou não reconhecida, usando classificação por palavras-chave.");
        }
        return KeywordClassifier.classify(title, description);
    }

    static Optional<TicketClassification> parse(String aiResponse) {
        if (aiResponse == null) {
            return Optional.empty();
        }
        String normalized = stripAccents(aiResponse).toUpperCase(Locale.ROOT);
        Matcher matcher = CLASSIFICATION_PATTERN.matcher(normalized);
        while (matcher.find()) {
            try {
                TicketCategory category = TicketCategory.valueOf(matcher.group(1));
                TicketPriority priority = TicketPriority.valueOf(matcher.group(2));
                TicketDepartment department = parseDepartment(matcher.group(3));
                return Optional.of(new TicketClassification(category, priority, department));
            } catch (IllegalArgumentException ignored) {
                // tenta o próximo trecho que pareça uma classificação
            }
        }
        return Optional.empty();
    }

    private static TicketDepartment parseDepartment(String value) {
        try {
            return TicketDepartment.valueOf(value);
        } catch (IllegalArgumentException e) {
            return TicketDepartment.SUPORTE_N1;
        }
    }

    static String stripAccents(String text) {
        return java.text.Normalizer.normalize(text, java.text.Normalizer.Form.NFD).replaceAll("\\p{M}", "");
    }
}
