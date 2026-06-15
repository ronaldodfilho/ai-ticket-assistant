package com.aiticket.backend.service;

import com.aiticket.backend.domain.enums.TicketCategory;
import com.aiticket.backend.domain.enums.TicketDepartment;
import com.aiticket.backend.domain.enums.TicketPriority;

/**
 * Resultado da triagem de um chamado.
 *
 * @param reason explicação curta da prioridade atribuída, exibida para o atendente e o cliente
 */
public record TicketClassification(TicketCategory category, TicketPriority priority, TicketDepartment department, String reason) {

    public static final int MAX_REASON_LENGTH = 300;

    public TicketClassification {
        if (reason != null && reason.length() > MAX_REASON_LENGTH) {
            reason = reason.substring(0, MAX_REASON_LENGTH - 1).trim() + "…";
        }
    }
}
