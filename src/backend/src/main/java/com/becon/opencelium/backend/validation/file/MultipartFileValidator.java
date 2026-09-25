package com.becon.opencelium.backend.validation.file;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.web.multipart.MultipartFile;

public class MultipartFileValidator implements ConstraintValidator<FileValidator, MultipartFile> {

    private long maxSize;

    @Override
    public void initialize(FileValidator constraintAnnotation) {
        this.maxSize = constraintAnnotation.maxSize();
    }

    @Override
    public boolean isValid(MultipartFile file, ConstraintValidatorContext context) {
        return file == null || file.getSize() <= maxSize;
    }
}