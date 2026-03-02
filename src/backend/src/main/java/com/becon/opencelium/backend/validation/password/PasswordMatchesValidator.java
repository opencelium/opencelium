package com.becon.opencelium.backend.validation.password;

import com.becon.opencelium.backend.resource.PasswordResetDTO;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PasswordMatchesValidator
        implements ConstraintValidator<PasswordMatches, PasswordResetDTO> {

    @Override
    public boolean isValid(PasswordResetDTO dto, ConstraintValidatorContext context) {
        if (dto.newPassword() == null) {
            // @NotBlank handles this case
            return true;
        }

        boolean matches = dto.newPassword().equals(dto.confirmPassword());

        if (!matches) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("Passwords do not match")
                    .addPropertyNode("confirmPassword")
                    .addConstraintViolation();
        }

        return matches;
    }
}
