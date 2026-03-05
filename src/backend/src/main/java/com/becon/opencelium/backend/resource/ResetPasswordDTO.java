package com.becon.opencelium.backend.resource;

import com.becon.opencelium.backend.validation.password.PasswordConfirmation;
import com.becon.opencelium.backend.validation.password.PasswordMatches;
import com.becon.opencelium.backend.validation.password.ValidPassword;
import jakarta.validation.constraints.NotBlank;

@PasswordMatches
public record ResetPasswordDTO(
        @NotBlank
        String token,
        @ValidPassword
        String newPassword,
        @ValidPassword
        String confirmPassword
) implements PasswordConfirmation {
}
