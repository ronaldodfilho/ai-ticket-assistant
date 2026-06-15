package com.aiticket.backend.controller;

import com.aiticket.backend.domain.enums.InteractionAuthor;
import com.aiticket.backend.dto.InteractionCreateDto;
import com.aiticket.backend.dto.TicketClassificationUpdateDto;
import com.aiticket.backend.dto.InteractionResponseDto;
import com.aiticket.backend.dto.TicketCreateDto;
import com.aiticket.backend.dto.TicketResponseDto;
import com.aiticket.backend.dto.TicketStatusUpdateDto;
import com.aiticket.backend.service.InteractionService;
import com.aiticket.backend.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;
    private final InteractionService interactionService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TicketResponseDto createTicket(@Valid @RequestBody TicketCreateDto dto) {
        return ticketService.createTicket(dto);
    }

    @GetMapping
    public List<TicketResponseDto> getAllTickets() {
        return ticketService.getAllTickets();
    }

    @GetMapping("/{id}")
    public TicketResponseDto getTicket(@PathVariable UUID id) {
        return ticketService.getTicket(id);
    }

    @PatchMapping("/{id}/status")
    public TicketResponseDto updateStatus(@PathVariable UUID id, @Valid @RequestBody TicketStatusUpdateDto dto) {
        return ticketService.updateStatus(id, dto.status());
    }

    @PatchMapping("/{id}/classification")
    public TicketResponseDto updateClassification(@PathVariable UUID id, @Valid @RequestBody TicketClassificationUpdateDto dto) {
        return ticketService.updateClassification(id, dto);
    }

    @GetMapping("/{id}/interactions")
    public List<InteractionResponseDto> getInteractions(@PathVariable UUID id) {
        return interactionService.getInteractionsByTicketId(id);
    }

    @PostMapping("/{id}/interactions")
    @ResponseStatus(HttpStatus.CREATED)
    public InteractionResponseDto addInteraction(@PathVariable UUID id, @Valid @RequestBody InteractionCreateDto dto) {
        InteractionResponseDto interaction = interactionService.addInteraction(id, dto);
        if (dto.author() == InteractionAuthor.USER) {
            ticketService.reclassifyIfUndefined(id);
        }
        return interaction;
    }

    @GetMapping("/{id}/summary")
    public Map<String, String> getSummary(@PathVariable UUID id) {
        return Map.of("summary", ticketService.summarizeTicket(id));
    }

    @GetMapping("/{id}/suggest-response")
    public Map<String, String> getSuggestedResponse(@PathVariable UUID id) {
        return Map.of("suggestion", ticketService.suggestResponse(id));
    }
}
