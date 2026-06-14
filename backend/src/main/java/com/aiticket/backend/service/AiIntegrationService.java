package com.aiticket.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Slf4j
public class AiIntegrationService {

    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent";

    private final String apiKey;
    private final String model;
    private final RestTemplate restTemplate;

    public AiIntegrationService(@Value("${gemini.api.key:}") String apiKey,
                                @Value("${gemini.model:gemini-flash-latest}") String model,
                                @Value("${gemini.timeout-seconds:30}") long timeoutSeconds) {
        this.apiKey = apiKey;
        this.model = model;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(10));
        factory.setReadTimeout(Duration.ofSeconds(timeoutSeconds));
        this.restTemplate = new RestTemplate(factory);

        if (isEnabled()) {
            log.info("IA ativa com o modelo {}.", model);
        } else {
            log.info("GEMINI_API_KEY não definida: usando classificação, resumo e sugestão locais.");
        }
    }

    public String getModel() {
        return model;
    }

    public boolean isEnabled() {
        return apiKey != null && !apiKey.isBlank() && !apiKey.equalsIgnoreCase("sua_chave_aqui");
    }

    /**
     * Envia o prompt ao Gemini. Retorna vazio se a IA não estiver configurada
     * ou se a chamada falhar, para que o chamador use um fallback local.
     */
    @SuppressWarnings("unchecked")
    public Optional<String> generateContent(String prompt) {
        if (!isEnabled()) {
            return Optional.empty();
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-goog-api-key", apiKey);

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                    "generationConfig", Map.of("temperature", 0.4, "maxOutputTokens", 2048)
            );

            Map<String, Object> response = restTemplate.postForObject(
                    GEMINI_URL.formatted(model), new HttpEntity<>(requestBody, headers), Map.class);

            if (response != null && response.get("candidates") instanceof List<?> candidates && !candidates.isEmpty()) {
                Map<String, Object> content = (Map<String, Object>) ((Map<String, Object>) candidates.get(0)).get("content");
                if (content != null && content.get("parts") instanceof List<?> parts && !parts.isEmpty()) {
                    Object text = ((Map<String, Object>) parts.get(0)).get("text");
                    if (text instanceof String s && !s.isBlank()) {
                        return Optional.of(s.trim());
                    }
                }
            }
            log.warn("Resposta do Gemini sem texto utilizável (finishReason: {}).", extractFinishReason(response));
        } catch (Exception e) {
            log.error("Erro ao chamar a API do Gemini (modelo {}): {}", model, e.getMessage());
        }
        return Optional.empty();
    }

    @SuppressWarnings("unchecked")
    private static Object extractFinishReason(Map<String, Object> response) {
        if (response != null && response.get("candidates") instanceof List<?> candidates && !candidates.isEmpty()) {
            return ((Map<String, Object>) candidates.get(0)).get("finishReason");
        }
        return response == null ? null : response.get("promptFeedback");
    }
}
