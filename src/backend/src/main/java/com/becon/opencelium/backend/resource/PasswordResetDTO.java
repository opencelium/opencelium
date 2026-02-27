package com.becon.opencelium.backend.resource;

import com.becon.opencelium.backend.validation.password.PasswordMatches;
import jakarta.validation.constraints.NotBlank;

@PasswordMatches
public record PasswordResetDTO(
        @NotBlank
        String token,
        @NotBlank
        String newPassword,
        @NotBlank
        String confirmPassword
) {
}
