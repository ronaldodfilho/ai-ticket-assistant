package com.aiticket.backend.repository;

import com.aiticket.backend.domain.entity.Ticket;
import com.aiticket.backend.domain.enums.TicketStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, UUID> {
    List<Ticket> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = "interactions")
    Optional<Ticket> findWithInteractionsById(UUID id);

    long countByStatus(TicketStatus status);
}
