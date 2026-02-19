package com.becon.opencelium.backend.resource;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordDTO(
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
