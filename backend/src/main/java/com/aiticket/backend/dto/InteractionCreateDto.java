package com.aiticket.backend.dto;

import com.aiticket.backend.domain.enums.InteractionAuthor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record InteractionCreateDto(
        @NotBlank(message = "Message is required") String message,
        @NotNull(message = "Author type is required") InteractionAuthor author,
        String authorName
) {}
