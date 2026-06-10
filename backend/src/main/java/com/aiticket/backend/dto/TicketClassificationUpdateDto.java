package com.aiticket.backend.dto;

import com.aiticket.backend.domain.enums.TicketCategory;
import com.aiticket.backend.domain.enums.TicketDepartment;
import com.aiticket.backend.domain.enums.TicketPriority;
import jakarta.validation.constraints.NotNull;

public record TicketClassificationUpdateDto(
        @NotNull(message = "A categoria é obrigatória") TicketCategory category,
        @NotNull(message = "A prioridade é obrigatória") TicketPriority priority,
        @NotNull(message = "O setor é obrigatório") TicketDepartment department
) {}
