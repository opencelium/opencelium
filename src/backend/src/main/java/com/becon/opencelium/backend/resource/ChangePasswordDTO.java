package com.becon.opencelium.backend.resource;

import com.becon.opencelium.backend.validation.password.PasswordConfirmation;
import com.becon.opencelium.backend.validation.password.PasswordMatches;
import com.becon.opencelium.backend.validation.password.ValidPassword;

@PasswordMatches
public record ChangePasswordDTO(
        @ValidPassword
        String currentPassword,
        @ValidPassword
        String newPassword,
        @ValidPassword
        String confirmPassword
) implements PasswordConfirmation {
}
