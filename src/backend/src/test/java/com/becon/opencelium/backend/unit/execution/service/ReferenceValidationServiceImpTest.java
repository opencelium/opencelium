package com.becon.opencelium.backend.unit.execution.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

import com.becon.opencelium.backend.execution.service.ReferenceValidationServiceImp;
import com.becon.opencelium.backend.reference.enums.ReferenceType;
import com.becon.opencelium.backend.reference.model.DirectReference.Part;
import com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationRequestDTO;
import com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO;
import com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.Issue;
import com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for {@link ReferenceValidationServiceImp}. The service has no collaborators: every
 * test feeds a reference and checks the reported issue, its position in the reference and its hint.
 *
 * <p>Run with: ./gradlew test --tests "*.ReferenceValidationServiceImpTest"
 */
@DisplayName("ReferenceValidationServiceImp")
class ReferenceValidationServiceImpTest {

    private static final String BODY = "#ababab.(response).body.$.";
    private static final String SAMPLE = """
            { "data": [ { "id": 1, "Name": "a" } ], "empty": [] }
            """;

    private final ReferenceValidationServiceImp service = new ReferenceValidationServiceImp();

    private ReferenceValidationResultDTO validate(String reference) {
        return validate(reference, null, null);
    }

    private ReferenceValidationResultDTO validate(String reference, List<String> iterators, Object sample) {
        return service.validate(new ReferenceValidationRequestDTO(reference, iterators, sample));
    }

    private static void assertSingleError(
            ReferenceValidationResultDTO result, IssueCode code, Integer position, String fragment) {
        assertThat(result.valid()).isFalse();
        assertThat(result.errors())
                .extracting(Issue::code, Issue::position, Issue::fragment)
                .containsExactly(tuple(code, position, fragment));
    }

    private static void assertSingleWarning(
            ReferenceValidationResultDTO result, IssueCode code, Integer position, String fragment) {
        assertThat(result.errors()).isEmpty();
        assertThat(result.warnings())
                .extracting(Issue::code, Issue::position, Issue::fragment)
                .containsExactly(tuple(code, position, fragment));
    }

    @Nested
    @DisplayName("valid references")
    class ValidReferences {

        @Test
        void validateReturnsValidWhenBodyPathIsWellFormed() {
            ReferenceValidationResultDTO result = validate(BODY + "data[*].id");

            assertThat(result.valid()).isTrue();
            assertThat(result.type()).isEqualTo(ReferenceType.DIRECT);
            assertThat(result.part()).isEqualTo(Part.BODY);
            assertThat(result.path()).isEqualTo("data[*].id");
            assertThat(result.warnings()).isEmpty();
        }

        @Test
        void validateReturnsValidWhenHeaderPathIsWellFormed() {
            ReferenceValidationResultDTO result = validate("#ababab.(response).header.$.Set-Cookie[\"Max-Age\"]");

            assertThat(result.valid()).isTrue();
            assertThat(result.part()).isEqualTo(Part.HEADER);
            assertThat(result.path()).isEqualTo("Set-Cookie[\"Max-Age\"]");
        }

        @Test
        void validateReturnsValidWhenWebhookHasKnownDataType() {
            ReferenceValidationResultDTO result = validate("${order.items[0].id:integer}");

            assertThat(result.valid()).isTrue();
            assertThat(result.type()).isEqualTo(ReferenceType.WEBHOOK);
            assertThat(result.path()).isEqualTo("order.items[0].id");
        }

        @Test
        void validateReturnsValidWhenWrappedReferenceIsWellFormed() {
            ReferenceValidationResultDTO result = validate("{%#ababab.(request).body.$.a[0]%}");

            assertThat(result.valid()).isTrue();
            assertThat(result.type()).isEqualTo(ReferenceType.WRAPPED_DIRECT);
            assertThat(result.path()).isEqualTo("a[0]");
        }

        @Test
        @DisplayName("validate — a sample given as a JSON object is matched by the path")
        void validateMarksSampleMatchedWhenPathExistsInSample() {
            Map<String, Object> sample = Map.of("data", List.of(Map.of("id", 1)));

            ReferenceValidationResultDTO result = validate(BODY + "data[*].id", null, sample);

            assertThat(result.sampleMatched()).isTrue();
            assertThat(result.warnings()).isEmpty();
        }
    }

    @Nested
    @DisplayName("reference structure")
    class ReferenceStructure {

        @Test
        void validateReportsInvalidColorWhenColorIsShort() {
            assertSingleError(validate("#abab.(response).body.$.a"), IssueCode.INVALID_COLOR, 0, "#abab");
        }

        @Test
        void validateReportsInvalidExchangeTypeWhenMisspelled() {
            assertSingleError(validate("#ababab.(responce).body.$.a"),
                    IssueCode.INVALID_EXCHANGE_TYPE, 7, ".(responce).");
        }

        @Test
        void validateReportsInvalidPartWhenPartIsUnknown() {
            assertSingleError(validate("#ababab.(response).bodyX.$.a"), IssueCode.INVALID_PART, 19, "bodyX");
        }

        @Test
        void validateReportsStatusHasPathWhenStatusHasPath() {
            assertSingleError(validate("#ababab.(response).status.$.x"), IssueCode.STATUS_HAS_PATH, 25, ".$.x");
        }

        @Test
        void validateReportsMissingRootWhenDollarIsOmitted() {
            ReferenceValidationResultDTO result = validate("#ababab.(response).body.data");

            assertSingleError(result, IssueCode.MISSING_ROOT, 24, "data");
            assertThat(result.errors().get(0).hint()).isEqualTo("Write body.$.data.");
        }

        @Test
        void validateReportsMissingDotAfterRootWhenBracketFollowsDollar() {
            assertSingleError(validate("#ababab.(response).body.$[0]"), IssueCode.MISSING_DOT_AFTER_ROOT, 25, "[0]");
        }

        @Test
        @DisplayName("validate — the position of an unclosed wrapper is the end of the reference")
        void validateReportsUnclosedWrapperWhenPercentBraceIsMissing() {
            String reference = "{%#ababab.(request).body.$.a[0]";

            assertSingleError(validate(reference), IssueCode.UNCLOSED_WRAPPER, reference.length(), null);
        }
    }

    @Nested
    @DisplayName("json path errors")
    class JsonPathErrors {

        @Test
        void validateReportsUnclosedBracketWhenBracketIsOpen() {
            assertSingleError(validate(BODY + "data[0"), IssueCode.UNCLOSED_BRACKET, 30, "[0");
        }

        @Test
        void validateReportsUnclosedQuoteWhenQuoteIsOpen() {
            assertSingleError(validate(BODY + "a['unclosed]"), IssueCode.UNCLOSED_QUOTE, 28, "['unclosed]");
        }

        @Test
        void validateReportsTrailingDotWhenPathEndsWithDot() {
            assertSingleError(validate(BODY + "data."), IssueCode.TRAILING_DOT, 30, ".");
        }

        @Test
        void validateReportsMissingDotWhenFieldFollowsBracket() {
            assertSingleError(validate(BODY + "data[0]name"), IssueCode.MISSING_DOT, 33, "name");
        }

        @Test
        void validateReportsInvalidBracketContentWhenContentIsWord() {
            assertSingleError(validate(BODY + "data[abc]"), IssueCode.INVALID_BRACKET_CONTENT, 31, "[abc]");
        }

        @Test
        void validateReportsQuoteOutsideBracketsWhenFieldIsQuoted() {
            assertSingleError(validate(BODY + "'name'"), IssueCode.QUOTE_OUTSIDE_BRACKETS, 26, "'name'");
        }

        @Test
        void validateReportsInvalidTildeWhenTildeFollowsField() {
            assertSingleError(validate(BODY + "items~"), IssueCode.INVALID_TILDE, 31, "~");
        }

        @Test
        void validateReportsTildeNotLastWhenPathContinues() {
            assertSingleError(validate(BODY + "items['k']~.x"), IssueCode.TILDE_NOT_LAST, 37, ".x");
        }

        @Test
        void validateReportsUnknownIteratorWhenNotInScope() {
            ReferenceValidationResultDTO result = validate(BODY + "data[i].id", List.of(), null);

            assertSingleError(result, IssueCode.UNKNOWN_ITERATOR, 31, "[i]");
            assertThat(result.errors().get(0).hint()).contains("not inside a loop");
        }

        @Test
        @DisplayName("validate — without iterators the caller's loop scope is unknown, so [i] is accepted")
        void validateSkipsIteratorCheckWhenIteratorsAreUnknown() {
            ReferenceValidationResultDTO result = validate(BODY + "data[i].id", null, null);

            assertThat(result.valid()).isTrue();
        }
    }

    @Nested
    @DisplayName("json path warnings")
    class JsonPathWarnings {

        @Test
        void validateWarnsDeepScanWhenPathHasDoubleDot() {
            assertSingleWarning(validate(BODY + ".id"), IssueCode.DEEP_SCAN, 25, "..");
        }

        @Test
        void validateWarnsDuplicateRootWhenDollarRepeats() {
            assertSingleWarning(validate(BODY + "$.data"), IssueCode.DUPLICATE_ROOT, 26, "$");
        }

        @Test
        void validateWarnsEmptyBracketsWhenBracketsAreEmpty() {
            assertSingleWarning(validate(BODY + "data[]"), IssueCode.EMPTY_BRACKETS, 30, "[]");
        }

        @Test
        void validateWarnsUnexpectedPathWhenAllSelectorHasField() {
            assertSingleWarning(validate("#ababab.(response).[*].foo"), IssueCode.UNEXPECTED_PATH_AFTER_ALL, 23, "foo");
        }
    }

    @Nested
    @DisplayName("header and webhook")
    class HeaderAndWebhook {

        @Test
        void validateReportsHeaderNameRequiredWhenNameIsMissing() {
            assertSingleError(validate("#ababab.(response).header"), IssueCode.HEADER_NAME_REQUIRED, 25, null);
        }

        @Test
        void validateReportsInvalidHeaderNameWhenNameHasSpace() {
            assertSingleError(validate("#ababab.(response).header.$.Bad Header"),
                    IssueCode.INVALID_HEADER_NAME, 31, " ");
        }

        @Test
        void validateReportsInvalidHeaderSelectorWhenSingleQuotesUsed() {
            ReferenceValidationResultDTO result = validate("#ababab.(response).header.$.Set-Cookie['Max-Age']");

            assertSingleError(result, IssueCode.INVALID_HEADER_SELECTOR, 38, "['Max-Age']");
            assertThat(result.errors().get(0).hint()).contains("Set-Cookie[\"Max-Age\"]");
        }

        @Test
        void validateReportsUnknownDataTypeWhenTypeIsUnknown() {
            assertSingleError(validate("${order.id:int}"), IssueCode.UNKNOWN_DATA_TYPE, 11, "int");
        }

        @Test
        void validateReportsPathRequiredWhenWebhookIsEmpty() {
            assertSingleError(validate("${}"), IssueCode.PATH_REQUIRED, 2, null);
        }
    }

    @Nested
    @DisplayName("other reference types")
    class OtherReferences {

        @Test
        void validateReportsInvalidReferenceWhenConnectorIdIsNotNumeric() {
            ReferenceValidationResultDTO result = validate("{#ab.token}");

            assertSingleError(result, IssueCode.INVALID_REFERENCE, null, null);
            assertThat(result.type()).isEqualTo(ReferenceType.REQUEST_DATA);
            assertThat(result.errors().get(0).message()).contains("Invalid ctorId");
        }

        @Test
        void validateReportsInvalidReferenceWhenPageParamIsUnknown() {
            ReferenceValidationResultDTO result = validate("@{foo}");

            assertSingleError(result, IssueCode.INVALID_REFERENCE, null, null);
            assertThat(result.errors().get(0).message()).contains("Unknown pagination param");
        }

        @Test
        void validateReportsUnknownReferenceWhenTextIsNotReference() {
            ReferenceValidationResultDTO result = validate("hello");

            assertSingleError(result, IssueCode.UNKNOWN_REFERENCE, 0, "hello");
            assertThat(result.type()).isNull();
        }

        @Test
        void validateReportsReferenceRequiredWhenBlank() {
            assertSingleError(validate("  "), IssueCode.REFERENCE_REQUIRED, null, null);
        }
    }

    @Nested
    @DisplayName("sample")
    class Sample {

        @Test
        void validateSuggestsClosestFieldWhenFieldIsMisspelled() {
            ReferenceValidationResultDTO result = validate(BODY + "dat[0].id", null, SAMPLE);

            assertSingleWarning(result, IssueCode.PATH_NOT_IN_SAMPLE, 26, "dat");
            assertThat(result.warnings().get(0).hint()).isEqualTo("Did you mean 'data'?");
            assertThat(result.sampleMatched()).isFalse();
        }

        @Test
        void validateSuggestsCaseFixWhenFieldCaseDiffers() {
            ReferenceValidationResultDTO result = validate(BODY + "data[0].name", null, SAMPLE);

            assertSingleWarning(result, IssueCode.PATH_NOT_IN_SAMPLE, 34, "name");
            assertThat(result.warnings().get(0).hint())
                    .isEqualTo("Did you mean 'Name'? Field names are case-sensitive.");
        }

        @Test
        void validateReportsFieldOnArrayWhenIndexIsMissing() {
            ReferenceValidationResultDTO result = validate(BODY + "data.id", null, SAMPLE);

            assertSingleWarning(result, IssueCode.FIELD_ON_ARRAY, 31, "id");
            assertThat(result.warnings().get(0).hint()).contains("data[*].id");
        }

        @Test
        void validateReportsIndexOutOfRangeWhenIndexExceedsSize() {
            ReferenceValidationResultDTO result = validate(BODY + "data[5]", null, SAMPLE);

            assertSingleWarning(result, IssueCode.INDEX_OUT_OF_RANGE, 30, "[5]");
            assertThat(result.warnings().get(0).message()).contains("has 1 item(s)");
        }

        @Test
        @DisplayName("validate — an empty array in the sample leaves the rest of the path unchecked")
        void validateLeavesSampleMatchedNullWhenArrayIsEmpty() {
            ReferenceValidationResultDTO result = validate(BODY + "empty[*].x", null, SAMPLE);

            assertSingleWarning(result, IssueCode.EMPTY_ARRAY_IN_SAMPLE, 31, "[*]");
            assertThat(result.sampleMatched()).isNull();
        }

        @Test
        void validateWarnsInvalidSampleWhenSampleIsNotJson() {
            ReferenceValidationResultDTO result = validate(BODY + "data", null, "not json");

            assertSingleWarning(result, IssueCode.INVALID_SAMPLE, null, null);
            assertThat(result.sampleMatched()).isNull();
        }

        @Test
        void validateReportsNoMatchWhenFilterMatchesNothing() {
            ReferenceValidationResultDTO result = validate(BODY + "data[?(@.id > 5)]", null, SAMPLE);

            assertSingleWarning(result, IssueCode.NO_MATCH_IN_SAMPLE, null, null);
            assertThat(result.sampleMatched()).isFalse();
        }
    }
}
