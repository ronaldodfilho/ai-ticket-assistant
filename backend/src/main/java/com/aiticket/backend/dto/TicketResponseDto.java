package com.aiticket.backend.dto;

import com.aiticket.backend.domain.enums.TicketCategory;
import com.aiticket.backend.domain.enums.TicketPriority;
import com.aiticket.backend.domain.enums.TicketStatus;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.UUID;

@Builder
public record TicketResponseDto(
        UUID id,
        String title,
        String description,
        TicketCategory category,
        TicketPriority priority,
        TicketStatus status,
        String department,
        String userName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
