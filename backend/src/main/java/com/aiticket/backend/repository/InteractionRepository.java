package com.aiticket.backend.repository;

import com.aiticket.backend.domain.entity.Interaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InteractionRepository extends JpaRepository<Interaction, UUID> {
    List<Interaction> findByTicketIdOrderByCreatedAtAsc(UUID ticketId);
}
