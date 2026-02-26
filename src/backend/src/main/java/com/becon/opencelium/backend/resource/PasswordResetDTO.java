package com.becon.opencelium.backend.resource;

import com.becon.opencelium.backend.validation.password.PasswordMatches;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@PasswordMatches
public record PasswordResetDTO(
        @NotBlank
        String token,
        @NotBlank
        @Size(min = 8, max = 100)
        String newPassword,
        @NotBlank
        @Size(min = 8, max = 100)
        String confirmPassword
) {
}
