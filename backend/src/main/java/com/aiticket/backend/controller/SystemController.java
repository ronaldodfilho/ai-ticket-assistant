package com.aiticket.backend.controller;

import com.aiticket.backend.service.AiIntegrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/system")
@RequiredArgsConstructor
public class SystemController {

    private final AiIntegrationService aiService;

    /** Informa ao frontend se a IA está ativa ou se o sistema está em modo local. */
    @GetMapping("/info")
    public Map<String, Object> info() {
        return Map.of(
                "aiEnabled", aiService.isEnabled(),
                "aiModel", aiService.isEnabled() ? aiService.getModel() : "local"
        );
    }
}
