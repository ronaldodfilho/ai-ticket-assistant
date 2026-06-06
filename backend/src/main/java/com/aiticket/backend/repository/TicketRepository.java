package com.aiticket.backend.repository;

import com.aiticket.backend.domain.entity.Ticket;
import com.aiticket.backend.domain.enums.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, UUID> {
    List<Ticket> findAllByOrderByCreatedAtDesc();

    long countByStatus(TicketStatus status);
}
