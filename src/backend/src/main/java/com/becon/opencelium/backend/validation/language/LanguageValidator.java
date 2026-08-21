package com.becon.opencelium.backend.validation.language;

import com.becon.opencelium.backend.application.language.LanguageService;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class LanguageValidator implements ConstraintValidator<ValidLanguage, String> {

    private final LanguageService languageService;

    public LanguageValidator(LanguageService languageService) {
        this.languageService = languageService;
    }

    @Override
    public boolean isValid(String language, ConstraintValidatorContext context) {
        if (language == null || language.isBlank()) {
            return true;
        }
        if (languageService.isSupported(language)) {
            return true;
        }

        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(
                        "Unsupported language '" + language + "'. Supported languages: "
                                + languageService.getSupported())
                .addConstraintViolation();
        return false;
    }
}
