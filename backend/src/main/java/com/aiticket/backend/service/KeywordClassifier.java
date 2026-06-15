package com.aiticket.backend.service;

import com.aiticket.backend.domain.enums.TicketCategory;
import com.aiticket.backend.domain.enums.TicketDepartment;
import com.aiticket.backend.domain.enums.TicketPriority;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Classificação local, usada quando a IA não está configurada ou não responde.
 *
 * A prioridade segue os mesmos critérios passados à IA: impacto (quantas pessoas e se a
 * operação parou), bloqueio (se a pessoa consegue trabalhar), prazo e segurança. A palavra
 * "urgente" dita pelo cliente, sozinha, não torna o chamado urgente.
 */
final class KeywordClassifier {

    private record Rule(TicketCategory category, TicketDepartment department, List<String> keywords) {}

    private enum Signal {
        SEGURANCA("possível incidente de segurança"),
        OPERACAO_PARADA("operação parada ou várias pessoas afetadas"),
        BLOQUEIO("pessoa impedida de trabalhar"),
        PRAZO("prazo próximo ou pedido de urgência"),
        DEGRADACAO("lentidão ou falha intermitente, com o sistema ainda funcionando"),
        SEM_IMPACTO("dúvida ou solicitação sem impacto imediato");

        final String description;

        Signal(String description) {
            this.description = description;
        }
    }

    private static final List<Rule> RULES = List.of(
            new Rule(TicketCategory.FISCAL, TicketDepartment.SUPORTE_ERP,
                    List.of("nota fiscal", "nf-e", "nfe", "nfs", "nfs-e", "sefaz", "icms", "imposto", "tributo", "fiscal", "xml", "danfe", "cfop", "sped")),
            new Rule(TicketCategory.FINANCEIRO, TicketDepartment.FINANCEIRO,
                    List.of("boleto", "pagamento", "fatura", "cobranca", "reembolso", "financeiro", "conta a pagar", "conta a receber", "pix", "cartao", "faturamento")),
            new Rule(TicketCategory.RH, TicketDepartment.RH,
                    List.of("ferias", "salario", "holerite", "contracheque", "ponto", "beneficio", "admissao", "demissao", "rh", "folha", "vale")),
            new Rule(TicketCategory.SISTEMA, TicketDepartment.SUPORTE_ERP,
                    List.of("erp", "sistema", "modulo", "relatorio", "tela", "cadastro", "erro ao salvar", "lancamento", "bug")),
            new Rule(TicketCategory.TI, TicketDepartment.INFRAESTRUTURA,
                    List.of("internet", "rede", "wifi", "wi-fi", "vpn", "impressora", "computador", "notebook", "senha", "email", "e-mail", "servidor", "acesso", "monitor", "teclado", "mouse", "outlook"))
    );

    private static final Map<Signal, List<String>> SIGNALS = new LinkedHashMap<>();

    static {
        SIGNALS.put(Signal.SEGURANCA, List.of("vírus", "malware", "ransomware", "invasão", "invadido", "hacker", "vazamento", "vazou", "phishing", "golpe", "conta invadida"));
        SIGNALS.put(Signal.OPERACAO_PARADA, List.of("fora do ar", "caiu", "parado", "parada", "parou", "ninguém consegue", "ninguém está conseguindo", "todo mundo", "toda a empresa", "todo o setor", "setor inteiro", "empresa inteira", "loja inteira", "todos os usuários", "todos os computadores", "todos os clientes", "vários usuários", "várias pessoas"));
        SIGNALS.put(Signal.BLOQUEIO, List.of("não consigo", "não consegue", "não funciona", "não abre", "não carrega", "não liga", "bloqueado", "bloqueada", "travado", "travada", "impedido", "rejeitando", "rejeita", "rejeitou", "erro", "falha"));
        SIGNALS.put(Signal.PRAZO, List.of("hoje", "agora", "prazo", "vence", "vencimento", "até amanhã", "o quanto antes", "urgente", "urgência", "imediato"));
        SIGNALS.put(Signal.DEGRADACAO, List.of("lento", "lenta", "lentidão", "demora", "demorando", "às vezes", "intermitente", "instável", "oscilando", "de vez em quando"));
        SIGNALS.put(Signal.SEM_IMPACTO, List.of("dúvida", "sugestão", "quando possível", "melhoria", "gostaria", "como faço", "como fazer", "informação", "sem pressa", "curiosidade"));
    }

    /** Palavras que não descrevem um problema: saudações, cortesias e termos genéricos. */
    private static final Set<String> NON_DESCRIPTIVE = Set.of(
            "bom", "boa", "dia", "dias", "tarde", "noite", "ola", "oi", "oii", "oie", "alo", "hey", "tudo", "bem", "beleza", "blz",
            "como", "vai", "esta", "preciso", "precisando", "ajuda", "ajudar", "socorro", "favor", "por", "obrigado", "obrigada",
            "att", "atenciosamente", "teste", "testando", "test", "ok", "certo", "pessoal", "equipe", "suporte", "alguem", "pode",
            "podem", "poderia", "voces", "voce", "problema", "problemas", "questao", "assunto", "chamado", "urgente", "urgencia",
            "com", "para", "pra", "que", "uma", "uns", "umas", "meu", "minha", "nao", "sim", "aqui", "isso", "este", "esse", "estou",
            "tenho", "tem", "ter", "sobre", "rapido", "duvida", "pergunta", "informacao", "help", "aguardo", "retorno", "contato", "falar");

    private static final int MIN_DESCRIPTIVE_WORDS = 3;

    private KeywordClassifier() {}

    static TicketClassification classify(String title, String description) {
        String text = normalize(title + " " + description);

        Rule rule = bestRule(text);
        Map<Signal, List<String>> found = findSignals(text);

        if (rule == null && found.keySet().stream().allMatch(s -> s == Signal.PRAZO || s == Signal.SEM_IMPACTO) && descriptiveWords(text) < MIN_DESCRIPTIVE_WORDS) {
            String reason = "Indefinida: a mensagem não descreve um problema (apenas saudação ou poucas palavras). "
                    + "É preciso pedir detalhes ao cliente antes de priorizar.";
            if (found.containsKey(Signal.PRAZO)) {
                reason = "Indefinida: o cliente pediu urgência, mas não explicou qual é o problema. "
                        + "É preciso pedir detalhes antes de priorizar.";
            }
            return new TicketClassification(TicketCategory.OUTROS, TicketPriority.INDEFINIDA, TicketDepartment.SUPORTE_N1, reason);
        }

        TicketCategory category = rule == null ? TicketCategory.OUTROS : rule.category();
        TicketDepartment department = rule == null ? TicketDepartment.SUPORTE_N1 : rule.department();
        TicketPriority priority = decidePriority(found, category);
        return new TicketClassification(category, priority, department, explain(priority, found, category));
    }

    private static TicketPriority decidePriority(Map<Signal, List<String>> found, TicketCategory category) {
        boolean sensitiveArea = category == TicketCategory.FISCAL || category == TicketCategory.FINANCEIRO;

        if (found.containsKey(Signal.SEGURANCA) || found.containsKey(Signal.OPERACAO_PARADA)) {
            return TicketPriority.URGENTE;
        }
        if (found.containsKey(Signal.BLOQUEIO) && found.containsKey(Signal.PRAZO) && sensitiveArea) {
            return TicketPriority.URGENTE;
        }
        if (found.containsKey(Signal.BLOQUEIO) || found.containsKey(Signal.PRAZO)) {
            return TicketPriority.ALTA;
        }
        if (found.containsKey(Signal.SEM_IMPACTO) && !found.containsKey(Signal.DEGRADACAO)) {
            return TicketPriority.BAIXA;
        }
        return TicketPriority.MEDIA;
    }

    private static String explain(TicketPriority priority, Map<Signal, List<String>> found, TicketCategory category) {
        List<String> parts = new ArrayList<>();
        for (Map.Entry<Signal, List<String>> entry : found.entrySet()) {
            if (relevant(priority, entry.getKey())) {
                parts.add(entry.getKey().description + " (\"" + String.join("\", \"", entry.getValue()) + "\")");
            }
        }

        String label = switch (priority) {
            case URGENTE -> "Urgente";
            case ALTA -> "Alta";
            case MEDIA -> "Média";
            case BAIXA -> "Baixa";
            case INDEFINIDA -> "Indefinida";
        };

        if (parts.isEmpty()) {
            return label + ": problema relatado sem sinais de bloqueio total, prazo ou impacto em várias pessoas.";
        }
        String reason = label + ": " + String.join("; ", parts) + ".";
        if (priority == TicketPriority.URGENTE && !found.containsKey(Signal.SEGURANCA) && !found.containsKey(Signal.OPERACAO_PARADA)) {
            reason += " Área " + (category == TicketCategory.FISCAL ? "fiscal" : "financeira") + " com risco de multa ou atraso.";
        }
        if (priority == TicketPriority.ALTA && found.keySet().equals(Set.of(Signal.PRAZO))) {
            reason += " O impacto real ainda precisa ser confirmado.";
        }
        return reason;
    }

    /** Só cita no motivo os sinais que justificam a prioridade escolhida. */
    private static boolean relevant(TicketPriority priority, Signal signal) {
        return switch (priority) {
            case URGENTE -> signal != Signal.SEM_IMPACTO && signal != Signal.DEGRADACAO;
            case ALTA -> signal == Signal.BLOQUEIO || signal == Signal.PRAZO;
            case MEDIA -> signal == Signal.DEGRADACAO;
            case BAIXA -> signal == Signal.SEM_IMPACTO;
            case INDEFINIDA -> false;
        };
    }

    private static Rule bestRule(String text) {
        Rule best = null;
        int bestScore = 0;
        for (Rule rule : RULES) {
            int score = (int) rule.keywords().stream().filter(k -> containsWord(text, k)).count();
            if (score > bestScore) {
                best = rule;
                bestScore = score;
            }
        }
        return best;
    }

    private static Map<Signal, List<String>> findSignals(String text) {
        Map<Signal, List<String>> found = new LinkedHashMap<>();
        SIGNALS.forEach((signal, keywords) -> {
            List<String> matches = keywords.stream().filter(k -> containsWord(text, normalize(k))).limit(3).toList();
            if (!matches.isEmpty()) {
                found.put(signal, matches);
            }
        });
        // "Não consigo" com "às vezes" é falha intermitente, não bloqueio total
        Optional.ofNullable(found.get(Signal.DEGRADACAO)).ifPresent(d -> {
            if (found.containsKey(Signal.BLOQUEIO) && !found.containsKey(Signal.OPERACAO_PARADA)) {
                found.remove(Signal.BLOQUEIO);
            }
        });
        return found;
    }

    private static long descriptiveWords(String text) {
        return Arrays.stream(text.split(" "))
                .filter(word -> word.length() >= 3 && !NON_DESCRIPTIVE.contains(word))
                .count();
    }

    private static boolean containsWord(String text, String keyword) {
        return (" " + text + " ").contains(" " + keyword + " ");
    }

    private static String normalize(String text) {
        return TicketClassifier.stripAccents(text == null ? "" : text)
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\- ]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }
}
