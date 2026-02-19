package com.becon.opencelium.backend.resource;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ForgetPasswordDTO(
        @NotBlank
        @Email
        String email
) {
}
