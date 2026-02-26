package com.becon.opencelium.backend.resource;

import jakarta.validation.constraints.NotBlank;

public record ForgotPasswordDTO(
        @NotBlank
        String email
) {
}
