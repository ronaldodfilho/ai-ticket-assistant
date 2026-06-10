package com.aiticket.backend.dto;

import com.aiticket.backend.domain.enums.InteractionAuthor;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record InteractionResponseDto(
        UUID id,
        UUID ticketId,
        InteractionAuthor author,
        String authorName,
        String message,
        Instant createdAt
) {}
