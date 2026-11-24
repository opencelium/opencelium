package com.becon.opencelium.backend.execution.service;

import com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationRequestDTO;
import com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO;

/**
 * Checks a reference, and above all its JSON path, while the user writes it, so mistakes show up
 * in the editor instead of failing the execution.
 */
public interface ReferenceValidationService {

    /**
     * Validates the syntax of the reference and its path, and, when a sample is given, looks the
     * path up in it. Never throws for an invalid reference: every problem is returned as an issue
     * with a hint on how to fix it.
     */
    ReferenceValidationResultDTO validate(ReferenceValidationRequestDTO request);
}
