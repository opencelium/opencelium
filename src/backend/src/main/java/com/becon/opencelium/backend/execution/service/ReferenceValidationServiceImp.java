package com.becon.opencelium.backend.execution.service;

import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.DEEP_SCAN;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.DUPLICATE_ROOT;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.EMPTY_ARRAY_IN_SAMPLE;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.EMPTY_BRACKETS;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.EMPTY_FIELD_NAME;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.FIELD_ON_ARRAY;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.FIELD_WHITESPACE;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.HEADER_NAME_REQUIRED;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.INDEX_OUT_OF_RANGE;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.INVALID_BRACKET_CONTENT;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.INVALID_COLOR;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.INVALID_EXCHANGE_TYPE;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.INVALID_FILTER;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.INVALID_HEADER_NAME;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.INVALID_HEADER_SELECTOR;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.INVALID_JSON_PATH;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.INVALID_PART;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.INVALID_REFERENCE;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.INVALID_SAMPLE;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.INVALID_TILDE;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.MISSING_DOT;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.MISSING_DOT_AFTER_ROOT;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.MISSING_ROOT;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.NOT_AN_ARRAY;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.NO_MATCH_IN_SAMPLE;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.PART_REQUIRED;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.PATH_NOT_IN_SAMPLE;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.PATH_REQUIRED;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.QUOTE_OUTSIDE_BRACKETS;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.REFERENCE_REQUIRED;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.STATUS_HAS_PATH;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.SURROUNDING_WHITESPACE;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.TILDE_NOT_LAST;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.TRAILING_DOT;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.UNCLOSED_BRACKET;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.UNCLOSED_QUOTE;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.UNCLOSED_WRAPPER;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.UNEXPECTED_CLOSING_BRACKET;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.UNEXPECTED_PATH_AFTER_ALL;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.UNKNOWN_DATA_TYPE;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.UNKNOWN_ITERATOR;
import static com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode.UNKNOWN_REFERENCE;

import com.becon.opencelium.backend.enums.execution.DataType;
import com.becon.opencelium.backend.reference.ReferenceParser;
import com.becon.opencelium.backend.reference.enums.ReferenceType;
import com.becon.opencelium.backend.reference.model.DirectReference.Part;
import com.becon.opencelium.backend.reference.model.EnhancementReference;
import com.becon.opencelium.backend.reference.model.PageReference;
import com.becon.opencelium.backend.reference.model.RequestDataReference;
import com.becon.opencelium.backend.reference.utility.ReferenceUtility;
import com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationRequestDTO;
import com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO;
import com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.Issue;
import com.becon.opencelium.backend.resource.connection.referencevalidation.ReferenceValidationResultDTO.IssueCode;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;

/**
 * Validates references the way the execution reads them ({@code ReferenceParser},
 * {@code ReferenceExtractor}), but reports every problem with its position and a hint instead of
 * failing on the first one.
 *
 * <p>Errors are what makes a reference fail at execution. Warnings are what works but is probably
 * a mistake, and every finding from the sample: a sample can be incomplete, so a path missing from
 * it is not necessarily wrong.
 */
@Service
public class ReferenceValidationServiceImp implements ReferenceValidationService {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final Pattern INDEX = Pattern.compile("-?\\d{1,9}");
    private static final Pattern SLICE_OR_UNION =
            Pattern.compile("-?\\d*:-?\\d*(:-?\\d+)?|-?\\d+(\\s*,\\s*-?\\d+)+");
    private static final Pattern QUOTED_UNION = Pattern.compile("'[^']*'(\\s*,\\s*'[^']*')+");
    private static final Pattern ITERATOR = Pattern.compile("[a-z]");
    private static final Pattern ITERATOR_IN_BRACKETS = Pattern.compile("\\[[a-z]]");
    private static final Pattern SPLIT_STRING_INDEX = Pattern.compile("[a-z0-9*]+");
    private static final Pattern HEADER_SELECTOR = Pattern.compile("\\[(\\*|\\d{1,9}|\"[^\"]+\")]");
    private static final String HEADER_NAME_SPECIALS = "!#$%&'*+-.^_`|~";
    private static final String PART_HINT =
            "Read one of: .status, .header.$.<name>, .body.$.<path> or .[*] for all responses.";
    private static final int MAX_LISTED_FIELDS = 10;

    @Override
    public ReferenceValidationResultDTO validate(ReferenceValidationRequestDTO request) {
        Validation validation = new Validation(request);
        validation.run();
        return validation.toResult();
    }

    private enum StepKind {
        FIELD, INDEX, WILDCARD, ITERATOR, ITERATOR_KEY, OTHER
    }

    /** One navigation step of a path; {@code start}/{@code end} are indexes in the path. */
    private record Step(StepKind kind, String value, int start, int end) {}

    private record PathScan(List<Step> steps, boolean deepScan) {
        boolean hasOther() {
            return steps.stream().anyMatch(step -> step.kind() == StepKind.OTHER);
        }
    }

    /** {@code close} is -1 when the bracket is not closed; {@code unclosedQuoteAt} -1 when quotes are fine. */
    private record BracketScan(int close, int unclosedQuoteAt) {}

    /** State of a single validation: the request, the findings, and what was recognised. */
    private static final class Validation {
        private final String reference;
        private final List<String> iterators; // null: the caller did not say which are in scope
        private final Object rawSample;
        private final List<Issue> errors = new ArrayList<>();
        private final List<Issue> warnings = new ArrayList<>();
        private ReferenceType type;
        private Part part;
        private String path;
        private Boolean sampleMatched;

        Validation(ReferenceValidationRequestDTO request) {
            this.reference = request.reference();
            this.iterators = request.iteratorsInScope().orElse(null);
            this.rawSample = request.sample();
        }

        ReferenceValidationResultDTO toResult() {
            return new ReferenceValidationResultDTO(
                    errors.isEmpty(), reference, type, part, path, sampleMatched, errors, warnings);
        }

        void run() {
            if (reference == null || reference.isBlank()) {
                error(REFERENCE_REQUIRED, "The reference is empty.",
                        "Pick a method and write the path to read, e.g. #ababab.(response).body.$.data.",
                        null, null);
                return;
            }
            if (!reference.equals(reference.strip())) {
                error(SURROUNDING_WHITESPACE, "The reference starts or ends with whitespace.",
                        "Remove the spaces before and after the reference.", 0, reference);
                return;
            }

            if (reference.startsWith("#{%")) {
                validateSimple(ReferenceType.ENHANCEMENT, EnhancementReference::parse, null);
            } else if (reference.startsWith("#")) {
                type = ReferenceType.DIRECT;
                validateDirect(reference, 0);
            } else if (reference.startsWith("{%")) {
                type = ReferenceType.WRAPPED_DIRECT;
                validateWrapped();
            } else if (reference.startsWith("${")) {
                type = ReferenceType.WEBHOOK;
                validateWebhook();
            } else if (reference.startsWith("@{")) {
                validateSimple(ReferenceType.PAGE, PageReference::parse, null);
            } else if (reference.startsWith("{")) {
                validateSimple(ReferenceType.REQUEST_DATA, RequestDataReference::parse,
                        "Write {key} or {#connectorId.key}, e.g. {token} or {#12.token}.");
            } else {
                error(UNKNOWN_REFERENCE, "This is not a reference.",
                        "A reference to another method starts with its color, e.g. "
                                + "#ababab.(response).body.$.id; a webhook variable is written ${name}.",
                        0, reference);
                return;
            }

            if (errors.isEmpty()) {
                confirmWithParser();
            }
        }

        // ------------------------------------------------------------------ reference structure

        private void validateSimple(ReferenceType referenceType, Function<String, ?> parser, String hint) {
            type = referenceType;
            try {
                parser.apply(reference);
            } catch (RuntimeException e) {
                error(INVALID_REFERENCE, e.getMessage(), hint, null, null);
            }
        }

        /** The parser of the execution is the reference: whatever passed here must pass there. */
        private void confirmWithParser() {
            try {
                ReferenceParser.parse(reference);
            } catch (RuntimeException e) {
                error(INVALID_REFERENCE, e.getMessage(), null, null, null);
            }
        }

        private void validateWrapped() {
            if (reference.length() < 4 || !reference.endsWith("%}")) {
                error(UNCLOSED_WRAPPER, "The reference starts with '{%' but does not end with '%}'.",
                        "Add '%}' at the end.", reference.length(), null);
                return;
            }
            validateDirect(reference.substring(2, reference.length() - 2), 2);
        }

        /** {@code s} is a direct reference starting at {@code offset} in {@link #reference}. */
        private void validateDirect(String s, int offset) {
            if (s.length() < 7 || s.charAt(0) != '#' || !isAlphanumeric(s.substring(1, 7))) {
                error(INVALID_COLOR, "The method color must be '#' followed by 6 letters or digits.",
                        "Pick the method again, e.g. #ababab.(response).body.$.id.",
                        offset, untilDot(s, 0));
                return;
            }

            int p = 7;
            String exchange = s.startsWith(".(response)", p) ? ".(response)"
                    : s.startsWith(".(request)", p) ? ".(request)"
                    : null;
            if (exchange == null) {
                String color = s.substring(0, 7);
                error(INVALID_EXCHANGE_TYPE, "After the color comes '.(response)' or '.(request)'.",
                        "Write " + color + ".(response)... or " + color + ".(request)...",
                        offset + p, s.substring(p, Math.min(s.length(), p + 12)));
                return;
            }

            p += exchange.length();
            if (p >= s.length() || s.charAt(p) != '.') {
                error(PART_REQUIRED, "The part to read is missing after '" + exchange + "'.", PART_HINT,
                        offset + p, p < s.length() ? s.substring(p) : null);
                return;
            }

            int partStart = ++p;
            if (s.startsWith("status", p)) {
                part = Part.STATUS;
                p += 6;
            } else if (s.startsWith("header", p)) {
                part = Part.HEADER;
                p += 6;
            } else if (s.startsWith("body", p)) {
                part = Part.BODY;
                p += 4;
            } else if (s.startsWith("[*]", p)) {
                part = Part.ALL;
                p += 3;
            }

            String rest = s.substring(p);
            if (part == null || (!rest.isEmpty() && rest.charAt(0) != '.')) {
                String written = untilDot(s, partStart);
                part = null;
                error(INVALID_PART, "'" + written + "' is not a part of a request or response.", PART_HINT,
                        offset + partStart, written);
                return;
            }

            switch (part) {
                case STATUS -> {
                    if (!rest.isEmpty()) {
                        error(STATUS_HAS_PATH, "The status has no path.", "End the reference after .status.",
                                offset + p, rest);
                    }
                }
                case ALL -> validateAllSelector(rest, offset + p);
                case BODY, HEADER -> validatePart(rest, offset + p, s.substring(partStart, p));
            }
        }

        private void validateAllSelector(String rest, int restOffset) {
            if (rest.isEmpty()) {
                path = "";
                return;
            }

            path = rest.substring(1);
            if (path.isEmpty()) {
                error(TRAILING_DOT, "The reference ends with '.'.", "Remove the '.' at the end.", restOffset, ".");
            } else if (!List.of("status", "header", "body").contains(path)) {
                warning(UNEXPECTED_PATH_AFTER_ALL, "After [*] only status, header or body is expected.",
                        "Use [*] alone for all responses, or [*].status, [*].header or [*].body.",
                        restOffset + 1, path);
            }
        }

        /** {@code rest} follows {@code body} or {@code header}, e.g. {@code .$.data[0]}. */
        private void validatePart(String rest, int restOffset, String partWord) {
            if (rest.isEmpty() || rest.equals(".$")) {
                path = "";
                if (part == Part.HEADER) {
                    error(HEADER_NAME_REQUIRED, "The header name is missing.",
                            "Write the header to read, e.g. header.$.Content-Type.", restOffset, null);
                } else {
                    checkSample("", 0, new PathScan(List.of(), false), Optional.of("$"));
                }
                return;
            }

            if (rest.startsWith(".$.")) {
                path = rest.substring(3);
                if (path.isEmpty()) {
                    error(TRAILING_DOT, "The path ends with '.'.",
                            "Remove the '.' after '$' or write a field name after it.", restOffset + 2, ".");
                } else if (part == Part.HEADER) {
                    validateHeaderPath(path, restOffset + 3);
                } else {
                    checkJsonPath(path, restOffset + 3);
                }
                return;
            }

            if (rest.startsWith(".$")) {
                String written = rest.substring(2);
                error(MISSING_DOT_AFTER_ROOT, "'$' must be followed by '.'.",
                        "Write " + partWord + ".$." + written + " instead of " + partWord + ".$" + written + ".",
                        restOffset + 2, written);
                return;
            }

            String written = rest.substring(1);
            error(MISSING_ROOT, "The path must start with '$.'.",
                    "Write " + partWord + ".$." + written + ".", restOffset + 1, written);
        }

        private void validateWebhook() {
            if (reference.length() < 3 || !reference.endsWith("}")) {
                error(UNCLOSED_WRAPPER, "The webhook reference starts with '${' but does not end with '}'.",
                        "Add '}' at the end, e.g. ${orderId}.", reference.length(), null);
                return;
            }

            String inner = reference.substring(2, reference.length() - 1);
            int colon = inner.lastIndexOf(':');
            path = colon < 0 ? inner : inner.substring(0, colon);

            if (colon >= 0) {
                String dataType = inner.substring(colon + 1);
                if (!DataType.getTypes().contains(dataType.toLowerCase(Locale.ROOT))) {
                    error(UNKNOWN_DATA_TYPE, "'" + dataType + "' is not a data type.",
                            "Use one of: " + String.join(", ", DataType.getTypes())
                                    + ", e.g. ${orderId:integer}.",
                            2 + colon + 1, dataType);
                }
            }

            if (path.isEmpty()) {
                error(PATH_REQUIRED, "The webhook variable name is missing.",
                        "Write the variable to read, e.g. ${orderId} or ${order.items[0].id:integer}.", 2, null);
                return;
            }
            checkJsonPath(path, 2);
        }

        private void validateHeaderPath(String p, int offset) {
            int bracket = p.indexOf('[');
            String name = bracket < 0 ? p : p.substring(0, bracket);
            if (name.isEmpty()) {
                error(HEADER_NAME_REQUIRED, "The header name is missing.",
                        "Write the header to read before '[', e.g. Set-Cookie[0].", offset, p);
                return;
            }

            for (int i = 0; i < name.length(); i++) {
                char c = name.charAt(i);
                if (!isHeaderNameChar(c)) {
                    error(INVALID_HEADER_NAME, "'" + c + "' is not allowed in a header name.",
                            c == ' ' ? "Header names have no spaces, e.g. Content-Type."
                                    : "Header names contain only letters, digits and " + HEADER_NAME_SPECIALS,
                            offset + i, String.valueOf(c));
                    return;
                }
            }

            if (bracket < 0) {
                return;
            }
            String selector = p.substring(bracket);
            if (!HEADER_SELECTOR.matcher(selector).matches()) {
                String hint = selector.startsWith("['")
                        ? "Cookie attributes use double quotes, e.g. " + name + "[\"Max-Age\"]."
                        : "After the header name write [0] for one value, [*] for all values or "
                                + "[\"attribute\"] for a cookie attribute.";
                error(INVALID_HEADER_SELECTOR, "'" + selector + "' cannot follow a header name.", hint,
                        offset + bracket, selector);
            }
        }

        // ------------------------------------------------------------------ json path

        /** Validates a JSON path starting at {@code offset} in {@link #reference}. */
        private void checkJsonPath(String p, int offset) {
            int errorsBefore = errors.size();
            PathScan scan = scanJsonPath(p, offset);
            if (errors.size() > errorsBefore) {
                return;
            }

            Optional<String> jsonPath = compile(p);
            if (jsonPath.isPresent()) {
                checkSample(p, offset, scan, jsonPath);
            }
        }

        private PathScan scanJsonPath(String p, int offset) {
            List<Step> steps = new ArrayList<>();
            boolean deepScan = false;
            int n = p.length();
            int i = 0;

            while (i < n) {
                char c = p.charAt(i);

                if (c == '.') {
                    if (i == n - 1) {
                        error(TRAILING_DOT, "The path ends with '.'.",
                                "Remove the '.' at the end or write a field name after it.", offset + i, ".");
                    } else if (i == 0 || p.charAt(i - 1) == '.') {
                        deepScan = true;
                        warning(DEEP_SCAN, "'..' searches the whole document for the field that follows.",
                                "Use a single '.' to read a direct child.", offset + i - 1, "..");
                    }
                    i++;
                    continue;
                }

                if (c == '[') {
                    BracketScan bracket = findClosingBracket(p, i);
                    if (bracket.unclosedQuoteAt() >= 0) {
                        error(UNCLOSED_QUOTE, "A quote opened inside [ ] is not closed.",
                                "Close the quote and the bracket, e.g. ['field name'].",
                                offset + bracket.unclosedQuoteAt(), p.substring(i));
                        break;
                    }
                    if (bracket.close() < 0) {
                        error(UNCLOSED_BRACKET, "'[' is not closed.",
                                "Add ']' after the index or field name.", offset + i, p.substring(i));
                        break;
                    }

                    String content = p.substring(i + 1, bracket.close());
                    int end = bracket.close() + 1;
                    Step step = bracketStep(content, i, end, offset);

                    if (end < n && p.charAt(end) == '~') {
                        checkTilde(p, content, step, end, offset);
                        end++;
                    } else if (step != null) {
                        steps.add(step);
                    }

                    i = end;
                    if (i < n && p.charAt(i) != '.' && p.charAt(i) != '[') {
                        String next = untilDelimiter(p, i);
                        error(MISSING_DOT, "'" + next + "' follows ']' without a '.'.",
                                "Add '.' between ']' and '" + next + "'.", offset + i, next);
                    }
                    continue;
                }

                if (c == ']') {
                    error(UNEXPECTED_CLOSING_BRACKET, "']' has no matching '['.",
                            "Remove the ']' or add the '[' it closes.", offset + i, "]");
                    i++;
                    continue;
                }

                if (c == '~') {
                    error(INVALID_TILDE, "'~' can only follow ['key'] (for-in key) or [index] (split string).",
                            "Remove the '~'.", offset + i, "~");
                    i++;
                    continue;
                }

                int start = i;
                while (i < n && ".[]~".indexOf(p.charAt(i)) < 0) {
                    i++;
                }
                String name = p.substring(start, i);
                checkFieldName(name, offset + start);
                steps.add(new Step(StepKind.FIELD, name, start, i));
            }

            return new PathScan(List.copyOf(steps), deepScan);
        }

        private void checkFieldName(String name, int position) {
            int quote = indexOfQuote(name);
            if (quote >= 0) {
                String clean = name.replace("'", "").replace("\"", "");
                error(QUOTE_OUTSIDE_BRACKETS, "Quotes are only allowed inside [ ].",
                        "Write the field as ['" + clean + "'] or without quotes: " + clean + ".",
                        position + quote, name);
            } else if (!name.equals(name.strip())) {
                warning(FIELD_WHITESPACE,
                        "The field '" + name + "' starts or ends with a space; spaces are part of the field name.",
                        "Remove the space unless the field name really has it.", position, name);
            }

            if ("$".equals(name)) {
                warning(DUPLICATE_ROOT, "'$' inside the path is read as a field named '$'.",
                        "The path already starts at the root: remove the extra '$.'.", position, name);
            }
        }

        /** Returns the step of {@code [content]}, or {@code null} after reporting it as invalid. */
        private Step bracketStep(String content, int start, int end, int offset) {
            int position = offset + start + 1;
            String fragment = "[" + content + "]";

            if (content.isEmpty()) {
                warning(EMPTY_BRACKETS, "'[]' is read as '[*]' (all items).",
                        "Write [*] for all items, [0] for the first item or [i] inside a loop.",
                        offset + start, fragment);
                return new Step(StepKind.WILDCARD, "*", start, end);
            }
            if (!content.equals(content.strip())) {
                error(INVALID_BRACKET_CONTENT, "Spaces are not allowed around the value inside [ ].",
                        "Write [" + content.strip() + "].", position, fragment);
                return null;
            }
            if ("*".equals(content)) {
                return new Step(StepKind.WILDCARD, "*", start, end);
            }
            if (INDEX.matcher(content).matches()) {
                return new Step(StepKind.INDEX, content, start, end);
            }
            if (ITERATOR.matcher(content).matches()) {
                checkIterator(content, "There is no loop with the iterator '" + content + "' around this reference.",
                        position, fragment);
                return new Step(StepKind.ITERATOR, content, start, end);
            }
            if (content.length() == 1 && Character.isUpperCase(content.charAt(0))) {
                error(INVALID_BRACKET_CONTENT, "Loop iterators are lowercase letters.",
                        "Write [" + content.toLowerCase(Locale.ROOT) + "].", position, fragment);
                return null;
            }
            if (content.charAt(0) == '\'' || content.charAt(0) == '"') {
                return quotedStep(content, start, end, position, fragment);
            }
            if (content.startsWith("?(")) {
                if (!content.endsWith(")")) {
                    error(INVALID_FILTER, "A filter must end with ')'.",
                            "Write a filter like [?(@.status == 'open')].", position, fragment);
                    return null;
                }
                return new Step(StepKind.OTHER, content, start, end);
            }
            if (SLICE_OR_UNION.matcher(content).matches()) {
                return new Step(StepKind.OTHER, content, start, end);
            }

            error(INVALID_BRACKET_CONTENT, "'" + content + "' is not valid inside [ ].",
                    "Use a number ([0]), * for all items ([*]), a loop iterator ([i]) or a quoted field "
                            + "name (['" + content + "']).",
                    position, fragment);
            return null;
        }

        private Step quotedStep(String content, int start, int end, int position, String fragment) {
            char quote = content.charAt(0);
            String name = content.length() < 2 ? "" : content.substring(1, content.length() - 1);

            if (content.length() < 2 || content.charAt(content.length() - 1) != quote || name.indexOf(quote) >= 0) {
                if (QUOTED_UNION.matcher(content).matches()) {
                    return new Step(StepKind.OTHER, content, start, end);
                }
                error(INVALID_BRACKET_CONTENT, "Only one quoted field name is allowed inside [ ].",
                        "Write ['name'], one field per bracket.", position, fragment);
                return null;
            }
            if (name.isEmpty()) {
                error(EMPTY_FIELD_NAME, "The field name inside [ ] is empty.",
                        "Write the field name between the quotes, e.g. ['id'].", position, fragment);
                return null;
            }
            if ("*".equals(name)) {
                return new Step(StepKind.ITERATOR_KEY, name, start, end);
            }
            if (name.length() == 1 && Character.isLetter(name.charAt(0))) {
                // the execution reads a one-letter name as the iterator of a for-in loop
                checkIterator(name, "['" + name + "'] is read as the for-in iterator '" + name
                        + "', but no loop around this reference defines it.", position, fragment);
                return new Step(StepKind.ITERATOR_KEY, name, start, end);
            }
            return new Step(StepKind.FIELD, name, start, end);
        }

        private void checkIterator(String iterator, String message, int position, String fragment) {
            if (iterators == null || iterators.contains(iterator)) {
                return;
            }
            String hint = iterators.isEmpty()
                    ? "This reference is not inside a loop: use [0] for one item or [*] for all items."
                    : "Use one of the iterators in scope: " + String.join(", ", iterators) + ".";
            error(UNKNOWN_ITERATOR, message, hint, position, fragment);
        }

        private void checkTilde(String p, String content, Step step, int tildeAt, int offset) {
            boolean forInKey = content.length() >= 2 && content.startsWith("'") && content.endsWith("'");
            if (step != null && !forInKey && !SPLIT_STRING_INDEX.matcher(content).matches()) {
                error(INVALID_TILDE, "'~' can only follow ['key'] (for-in key) or [index] (split string).",
                        "Remove the '~', or write ['k']~ or [i]~.", offset + tildeAt, "~");
            }
            if (tildeAt != p.length() - 1) {
                error(TILDE_NOT_LAST, "'~' must be the last character of the path.",
                        "Remove what follows the '~'.", offset + tildeAt + 1, p.substring(tildeAt + 1));
            }
        }

        /**
         * Builds the JSON path the execution would evaluate (iterators at their first value, custom
         * {@code ~} operators removed) and compiles it.
         */
        private Optional<String> compile(String p) {
            String runtime = p;
            if (runtime.endsWith("~")) {
                runtime = runtime.substring(0, runtime.lastIndexOf('['));
            }
            runtime = ITERATOR_IN_BRACKETS.matcher(runtime).replaceAll("[0]").replace("[]", "[*]");
            if (runtime.endsWith(".") && !runtime.endsWith("..")) {
                runtime = runtime.substring(0, runtime.length() - 1);
            }

            try {
                String joined = String.join(".", ReferenceUtility.splitPaths(runtime));
                String jsonPath = joined.isBlank() || joined.startsWith("[") ? "$" + joined : "$." + joined;
                JsonPath.compile(jsonPath);
                return Optional.of(jsonPath);
            } catch (RuntimeException e) {
                error(INVALID_JSON_PATH, "The path is not a valid JSON path: " + e.getMessage(),
                        "Check the dots, brackets and quotes of the path.", null, null);
                return Optional.empty();
            }
        }

        // ------------------------------------------------------------------ sample

        private void checkSample(String p, int offset, PathScan scan, Optional<String> jsonPath) {
            if (rawSample == null || scan.deepScan()) {
                return;
            }

            Optional<Object> parsed = parseSample();
            if (parsed.isEmpty()) {
                warning(INVALID_SAMPLE, "The sample is not valid JSON, so the path was not looked up in it.",
                        null, null, null);
                return;
            }
            Object sample = parsed.get();

            if (scan.hasOther()) {
                // filters, slices and unions: let JsonPath evaluate the whole path
                sampleMatched = matchesWithJsonPath(sample, jsonPath.orElseThrow());
                if (!sampleMatched) {
                    warning(NO_MATCH_IN_SAMPLE, "The path matches nothing in the sample.",
                            "Check the filter or index range against the sample.", null, null);
                }
                return;
            }

            List<Object> current = List.of(sample);
            for (int k = 0; k < scan.steps().size(); k++) {
                Step step = scan.steps().get(k);
                String where = k == 0 ? "the root of the sample"
                        : "'" + stripTrailingDot(p.substring(0, step.start())) + "'";
                int position = offset + step.start();
                String fragment = p.substring(step.start(), step.end());

                Optional<List<Object>> next = walk(step, current, where, position, fragment);
                if (next.isEmpty()) {
                    return;
                }
                current = next.get();
            }
            sampleMatched = true;
        }

        /** Applies {@code step} to every value; reports and returns empty when nothing is found. */
        private Optional<List<Object>> walk(Step step, List<Object> values, String where, int position,
                String fragment) {
            List<Object> next = new ArrayList<>();

            switch (step.kind()) {
                case FIELD -> {
                    for (Object value : values) {
                        if (value instanceof Map<?, ?> map && map.containsKey(step.value())) {
                            next.add(map.get(step.value()));
                        }
                    }
                    if (next.isEmpty()) {
                        reportMissingField(step.value(), values, where, position, fragment);
                    }
                }
                case INDEX -> {
                    int index = Integer.parseInt(step.value());
                    boolean anyList = false;
                    int size = 0;
                    for (Object value : values) {
                        if (value instanceof List<?> list) {
                            anyList = true;
                            size = list.size();
                            int resolved = index < 0 ? list.size() + index : index;
                            if (resolved >= 0 && resolved < list.size()) {
                                next.add(list.get(resolved));
                            }
                        }
                    }
                    if (!anyList) {
                        notAnArray(values, where, position, fragment);
                    } else if (next.isEmpty()) {
                        missing(INDEX_OUT_OF_RANGE, "Index " + index + " is out of range: " + where + " has "
                                        + size + " item(s) in the sample.",
                                size == 0 ? "The array is empty in the sample."
                                        : "Use an index from 0 to " + (size - 1) + ", or -1 for the last item.",
                                position, fragment);
                    }
                }
                case WILDCARD, ITERATOR -> {
                    boolean anyContainer = false;
                    for (Object value : values) {
                        if (value instanceof List<?> list) {
                            anyContainer = true;
                            next.addAll(list);
                        } else if (value instanceof Map<?, ?> map && step.kind() == StepKind.WILDCARD) {
                            anyContainer = true;
                            next.addAll(map.values());
                        }
                    }
                    if (!anyContainer) {
                        notAnArray(values, where, position, fragment);
                    } else if (next.isEmpty()) {
                        emptyArray(where, position, fragment);
                    }
                }
                case ITERATOR_KEY -> {
                    for (Object value : values) {
                        if (value instanceof Map<?, ?> map) {
                            next.addAll(map.values());
                        }
                    }
                    if (next.isEmpty()) {
                        missing(PATH_NOT_IN_SAMPLE, fragment + " reads the fields of an object, but " + where
                                        + " is " + describe(values) + " in the sample.",
                                "Use a for-in loop over an object, or [*] for the items of an array.",
                                position, fragment);
                    }
                }
                case OTHER -> next.addAll(values); // never reached: such paths go to JsonPath
            }

            return next.isEmpty() ? Optional.empty() : Optional.of(next);
        }

        private void reportMissingField(String name, List<Object> values, String where, int position,
                String fragment) {
            if (!values.isEmpty() && values.stream().allMatch(List.class::isInstance)) {
                String prefix = where.startsWith("'") ? where.substring(1, where.length() - 1) : "";
                missing(FIELD_ON_ARRAY, where + " is an array, so it has no field '" + name + "'.",
                        "Pick items first: " + prefix + "[*]." + name + " for all items, "
                                + prefix + "[0]." + name + " for the first one, or "
                                + prefix + "[i]." + name + " inside a loop.",
                        position, fragment);
                return;
            }

            Set<String> keys = new LinkedHashSet<>();
            values.stream()
                    .filter(Map.class::isInstance)
                    .forEach(value -> ((Map<?, ?>) value).keySet().forEach(key -> keys.add(String.valueOf(key))));

            if (keys.isEmpty()) {
                missing(PATH_NOT_IN_SAMPLE, where + " is " + describe(values) + " in the sample, so it has no field '"
                        + name + "'.", "Remove '" + name + "' from the path.", position, fragment);
                return;
            }

            String hint = closest(name, keys)
                    .map(suggestion -> "Did you mean '" + suggestion + "'?"
                            + (suggestion.equalsIgnoreCase(name) ? " Field names are case-sensitive." : ""))
                    .orElseGet(() -> "Available fields: " + String.join(", ",
                            keys.stream().limit(MAX_LISTED_FIELDS).toList())
                            + (keys.size() > MAX_LISTED_FIELDS ? ", ..." : "") + ".");
            missing(PATH_NOT_IN_SAMPLE, "Field '" + name + "' does not exist in " + where + ".", hint,
                    position, fragment);
        }

        private void notAnArray(List<Object> values, String where, int position, String fragment) {
            boolean object = values.stream().anyMatch(Map.class::isInstance);
            missing(NOT_AN_ARRAY, where + " is " + describe(values) + " in the sample, not an array.",
                    object ? "Read a field of the object with .name instead of " + fragment + "."
                            : "Remove " + fragment + " from the path.",
                    position, fragment);
        }

        private void emptyArray(String where, int position, String fragment) {
            // the path may well be right: the sample just has no item to look into
            sampleMatched = null;
            warning(EMPTY_ARRAY_IN_SAMPLE, where + " is an empty array in the sample, so the rest of the path "
                    + "could not be checked.", "Use a sample with at least one item.", position, fragment);
        }

        private void missing(IssueCode code, String message, String hint, int position, String fragment) {
            sampleMatched = false;
            warning(code, message, hint, position, fragment);
        }

        private Optional<Object> parseSample() {
            try {
                if (rawSample instanceof String text) {
                    return Optional.ofNullable(MAPPER.readValue(text, Object.class));
                }
                return Optional.ofNullable(MAPPER.convertValue(rawSample, Object.class));
            } catch (JsonProcessingException | IllegalArgumentException e) {
                return Optional.empty();
            }
        }

        private static boolean matchesWithJsonPath(Object sample, String jsonPath) {
            try {
                Object result = JsonPath.read(sample, jsonPath);
                return !(result instanceof List<?> list && list.isEmpty());
            } catch (RuntimeException e) {
                // PathNotFoundException, or a filter that cannot be applied to the sample
                return false;
            }
        }

        // ------------------------------------------------------------------ helpers

        private void error(IssueCode code, String message, String hint, Integer position, String fragment) {
            errors.add(new Issue(code, message, hint, position, fragment));
        }

        private void warning(IssueCode code, String message, String hint, Integer position, String fragment) {
            warnings.add(new Issue(code, message, hint, position, fragment));
        }
    }

    private static BracketScan findClosingBracket(String p, int open) {
        char quote = 0;
        int quoteAt = -1;
        int depth = 0;
        for (int j = open + 1; j < p.length(); j++) {
            char c = p.charAt(j);
            if (quote != 0) {
                if (c == quote) {
                    quote = 0;
                }
            } else if (c == '\'' || c == '"') {
                quote = c;
                quoteAt = j;
            } else if (c == '[') {
                depth++;
            } else if (c == ']') {
                if (depth == 0) {
                    return new BracketScan(j, -1);
                }
                depth--;
            }
        }
        return new BracketScan(-1, quote != 0 ? quoteAt : -1);
    }

    private static boolean isAlphanumeric(String s) {
        return s.chars().allMatch(c -> c < 128 && Character.isLetterOrDigit(c));
    }

    private static boolean isHeaderNameChar(char c) {
        return (c < 128 && Character.isLetterOrDigit(c)) || HEADER_NAME_SPECIALS.indexOf(c) >= 0;
    }

    private static int indexOfQuote(String s) {
        for (int i = 0; i < s.length(); i++) {
            if (s.charAt(i) == '\'' || s.charAt(i) == '"') {
                return i;
            }
        }
        return -1;
    }

    private static String untilDot(String s, int from) {
        int dot = s.indexOf('.', from);
        return dot < 0 ? s.substring(from) : s.substring(from, dot);
    }

    private static String untilDelimiter(String s, int from) {
        int i = from;
        while (i < s.length() && ".[".indexOf(s.charAt(i)) < 0) {
            i++;
        }
        return s.substring(from, i);
    }

    private static String stripTrailingDot(String s) {
        return s.endsWith(".") ? s.substring(0, s.length() - 1) : s;
    }

    private static String describe(List<Object> values) {
        Object value = values.isEmpty() ? null : values.get(0);
        if (value instanceof Map) {
            return "an object";
        }
        if (value instanceof List) {
            return "an array";
        }
        if (value instanceof String) {
            return "a string";
        }
        if (value instanceof Number) {
            return "a number";
        }
        if (value instanceof Boolean) {
            return "a boolean";
        }
        return "null";
    }

    /** The key closest to {@code name}, if one is close enough to be a typo. */
    private static Optional<String> closest(String name, Collection<String> keys) {
        Optional<String> sameIgnoringCase = keys.stream().filter(name::equalsIgnoreCase).findFirst();
        if (sameIgnoringCase.isPresent()) {
            return sameIgnoringCase;
        }

        int threshold = Math.max(2, name.length() / 3);
        String best = null;
        int bestDistance = Integer.MAX_VALUE;
        for (String key : keys) {
            int distance = levenshtein(name.toLowerCase(Locale.ROOT), key.toLowerCase(Locale.ROOT));
            if (distance < bestDistance) {
                best = key;
                bestDistance = distance;
            }
        }
        return bestDistance <= threshold ? Optional.of(best) : Optional.empty();
    }

    private static int levenshtein(String a, String b) {
        int[] previous = new int[b.length() + 1];
        int[] current = new int[b.length() + 1];
        for (int j = 0; j <= b.length(); j++) {
            previous[j] = j;
        }
        for (int i = 1; i <= a.length(); i++) {
            current[0] = i;
            for (int j = 1; j <= b.length(); j++) {
                int substitution = previous[j - 1] + (a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1);
                current[j] = Math.min(substitution, Math.min(previous[j], current[j - 1]) + 1);
            }
            int[] swap = previous;
            previous = current;
            current = swap;
        }
        return previous[b.length()];
    }
}
