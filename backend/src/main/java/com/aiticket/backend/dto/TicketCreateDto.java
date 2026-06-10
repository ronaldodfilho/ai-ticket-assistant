package com.aiticket.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TicketCreateDto(
        @NotBlank(message = "O título é obrigatório")
        @Size(max = 150, message = "O título deve ter no máximo 150 caracteres")
        String title,

        @NotBlank(message = "A descrição é obrigatória")
        @Size(max = 5000, message = "A descrição deve ter no máximo 5000 caracteres")
        String description,

        @Size(max = 100, message = "O nome deve ter no máximo 100 caracteres")
        String userName
) {}
