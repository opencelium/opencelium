package com.becon.opencelium.backend.resource.connection.referencevalidation;

import com.becon.opencelium.backend.reference.enums.ReferenceType;
import com.becon.opencelium.backend.reference.model.DirectReference;
import java.util.List;

/**
 * Result of {@code POST /connection/reference/validate}.
 *
 * @param valid {@code true} when {@code errors} is empty: the reference can be parsed and its path
 *     compiles; warnings never make a reference invalid
 * @param reference the validated reference, as received
 * @param type the kind of reference, {@code null} when it could not be recognised
 * @param part the part of a direct reference that is read, {@code null} for other references
 * @param path the path inside the part or the webhook variables, {@code null} when there is none
 * @param sampleMatched whether the path was found in the sample; {@code null} when no sample was
 *     given or the path could not be checked against it
 * @param errors problems that make the reference fail at execution
 * @param warnings things that work but are probably not what the user meant, and paths not found
 *     in the sample
 */
public record ReferenceValidationResultDTO(
        boolean valid,
        String reference,
        ReferenceType type,
        DirectReference.Part part,
        String path,
        Boolean sampleMatched,
        List<Issue> errors,
        List<Issue> warnings) {

    public ReferenceValidationResultDTO {
        errors = List.copyOf(errors);
        warnings = List.copyOf(warnings);
    }

    /**
     * One problem found in the reference.
     *
     * @param code a stable identifier the frontend can translate
     * @param message what is wrong, in English
     * @param hint how to fix it, in English; {@code null} when there is nothing to suggest
     * @param position zero-based index in {@code reference} where the problem starts; {@code null}
     *     when it concerns the reference as a whole
     * @param fragment the text at {@code position} the problem is about; {@code null} with it
     */
    public record Issue(IssueCode code, String message, String hint, Integer position, String fragment) {}

    /** Identifiers of the problems the validation reports. */
    public enum IssueCode {
        // whole reference
        REFERENCE_REQUIRED,
        SURROUNDING_WHITESPACE,
        UNKNOWN_REFERENCE,
        INVALID_REFERENCE,
        UNCLOSED_WRAPPER,
        // direct reference structure
        INVALID_COLOR,
        INVALID_EXCHANGE_TYPE,
        PART_REQUIRED,
        INVALID_PART,
        STATUS_HAS_PATH,
        UNEXPECTED_PATH_AFTER_ALL,
        MISSING_ROOT,
        MISSING_DOT_AFTER_ROOT,
        // json path
        PATH_REQUIRED,
        TRAILING_DOT,
        DEEP_SCAN,
        DUPLICATE_ROOT,
        UNCLOSED_BRACKET,
        UNEXPECTED_CLOSING_BRACKET,
        UNCLOSED_QUOTE,
        QUOTE_OUTSIDE_BRACKETS,
        EMPTY_BRACKETS,
        EMPTY_FIELD_NAME,
        INVALID_BRACKET_CONTENT,
        INVALID_FILTER,
        UNKNOWN_ITERATOR,
        MISSING_DOT,
        INVALID_TILDE,
        TILDE_NOT_LAST,
        FIELD_WHITESPACE,
        INVALID_JSON_PATH,
        // header
        HEADER_NAME_REQUIRED,
        INVALID_HEADER_NAME,
        INVALID_HEADER_SELECTOR,
        // webhook
        UNKNOWN_DATA_TYPE,
        // sample
        INVALID_SAMPLE,
        PATH_NOT_IN_SAMPLE,
        FIELD_ON_ARRAY,
        NOT_AN_ARRAY,
        INDEX_OUT_OF_RANGE,
        EMPTY_ARRAY_IN_SAMPLE,
        NO_MATCH_IN_SAMPLE
    }
}
