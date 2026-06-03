package com.aiticket.backend.service;

import com.aiticket.backend.domain.enums.TicketCategory;
import com.aiticket.backend.domain.enums.TicketPriority;

public record TicketClassification(TicketCategory category, TicketPriority priority, String department) {

    public static final TicketClassification DEFAULT =
            new TicketClassification(TicketCategory.OUTROS, TicketPriority.MEDIA, "SUPORTE_N1");
}
