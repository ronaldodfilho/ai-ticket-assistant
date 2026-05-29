package com.aiticket.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record TicketCreateDto(
        @NotBlank(message = "Title is required") String title,
        @NotBlank(message = "Description is required") String description,
        String userName
) {}
