package com.aiticket.backend.dto;

import com.aiticket.backend.domain.enums.TicketStatus;
import jakarta.validation.constraints.NotNull;

public record TicketStatusUpdateDto(@NotNull(message = "Status is required") TicketStatus status) {}
