package com.aiticket.backend.dto;

import com.aiticket.backend.domain.enums.InteractionAuthor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record InteractionCreateDto(
        @NotBlank(message = "A mensagem é obrigatória")
        @Size(max = 5000, message = "A mensagem deve ter no máximo 5000 caracteres")
        String message,

        @NotNull(message = "O autor é obrigatório")
        InteractionAuthor author,

        @Size(max = 100, message = "O nome deve ter no máximo 100 caracteres")
        String authorName
) {}
