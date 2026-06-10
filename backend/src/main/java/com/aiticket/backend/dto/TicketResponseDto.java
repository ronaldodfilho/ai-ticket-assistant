package com.aiticket.backend.dto;

import com.aiticket.backend.domain.enums.TicketCategory;
import com.aiticket.backend.domain.enums.TicketDepartment;
import com.aiticket.backend.domain.enums.TicketPriority;
import com.aiticket.backend.domain.enums.TicketStatus;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record TicketResponseDto(
        UUID id,
        String title,
        String description,
        TicketCategory category,
        TicketPriority priority,
        TicketStatus status,
        TicketDepartment department,
        String userName,
        Instant createdAt,
        Instant updatedAt
) {}
