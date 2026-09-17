package io.opencelium.core.invoker.xml;

import io.opencelium.core.invoker.InvokerFormat;
import io.opencelium.core.invoker.InvokerIssue;
import io.opencelium.core.invoker.InvokerReadException;
import io.opencelium.core.invoker.ReadResult;
import io.opencelium.common.http.ContentType;
import io.opencelium.common.http.Header;
import io.opencelium.common.http.HttpMethod;
import io.opencelium.common.invoker.Invoker;
import io.opencelium.common.invoker.InvokerId;
import io.opencelium.common.invoker.operation.Body;
import io.opencelium.common.invoker.operation.BodyEnvelope;
import io.opencelium.common.invoker.operation.Operation;
import io.opencelium.common.invoker.operation.OperationId;
import io.opencelium.common.invoker.operation.OperationRole;
import io.opencelium.common.invoker.operation.QueryParameter;
import io.opencelium.common.invoker.operation.Request;
import io.opencelium.common.invoker.operation.Response;
import io.opencelium.common.invoker.operation.ResponseStatus;
import io.opencelium.common.invoker.pagination.PageAction;
import io.opencelium.common.invoker.pagination.PageParam;
import io.opencelium.common.invoker.pagination.PageRule;
import io.opencelium.common.invoker.pagination.Pagination;
import io.opencelium.common.invoker.schema.ArraySchema;
import io.opencelium.common.invoker.schema.Field;
import io.opencelium.common.invoker.schema.ObjectSchema;
import io.opencelium.common.invoker.schema.ScalarSchema;
import io.opencelium.common.invoker.schema.ScalarType;
import io.opencelium.common.invoker.schema.Schema;
import io.opencelium.common.invoker.schema.UndefinedSchema;
import io.opencelium.common.invoker.schema.Value;
import io.opencelium.common.invoker.schema.XmlAttribute;
import io.opencelium.common.invoker.setting.ConnectorSetting;
import io.opencelium.common.invoker.setting.Visibility;
import org.jspecify.annotations.Nullable;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Supplier;

import static io.opencelium.core.invoker.xml.XmlElements.attribute;
import static io.opencelium.core.invoker.xml.XmlElements.build;
import static io.opencelium.core.invoker.xml.XmlElements.child;
import static io.opencelium.core.invoker.xml.XmlElements.children;
import static io.opencelium.core.invoker.xml.XmlElements.location;
import static io.opencelium.core.invoker.xml.XmlElements.text;
import static io.opencelium.core.invoker.xml.XmlElements.textOrNull;

/**
 * Reads an OpenCelium 5.x invoker file and upgrades it to the current model.
 *
 * <p>5.x files have no schema, so this reader accepts what the 5.x parser accepted and then applies
 * one conversion per difference between the formats. Every conversion that changes something is
 * reported, graded by what the author needs to do about it:
 * <ul>
 *   <li>{@code INFO} — a mechanical change, such as deriving an id from a name</li>
 *   <li>{@code WARNING} — converted, but a person should check the result, such as merging two
 *       responses that share a status code</li>
 *   <li>{@code ERROR} — no faithful conversion exists; the invoker is not imported</li>
 * </ul>
 */
final class LegacyInvokerReader {

    ReadResult read(Document document) {
        return new Conversion(document.getDocumentElement()).run();
    }

    /** The state of converting one file. A new one is made per file, which keeps the reader thread-safe. */
    private static final class Conversion {

        private static final Set<PageParam> ZERO_DEFAULTED = EnumSet.of(PageParam.LIMIT, PageParam.OFFSET, PageParam.PAGE);

        private final Element root;
        private final List<InvokerIssue> issues = new ArrayList<>();
        private final Map<String, OperationId> operationIds = new LinkedHashMap<>();
        private final Set<String> onceNotes = new HashSet<>();

        Conversion(Element root) {
            this.root = root;
        }

        ReadResult run() {
            String name = child(root, "name").map(XmlElements::text).orElse("");
            if (name.isEmpty()) {
                fail(InvokerIssue.error("/invoker", "the invoker has no <name>"));
            }
            InvokerId id = deriveInvokerId(name);

            List<Element> operationElements = children(child(root, "operations"), "operation");
            operationElements.forEach(this::registerOperationId);

            Pagination sharedPagination = child(root, "pagination").map(this::pagination).orElse(null);
            List<ConnectorSetting> settings = convertAll(children(child(root, "requiredData"), "item"), this::setting);
            List<Operation> operations = convertAll(operationElements,
                    element -> operation(element, sharedPagination));
            reportSharedPagination(sharedPagination, operationElements);

            if (operationElements.isEmpty()) {
                issues.add(InvokerIssue.error("/invoker", "the invoker declares no operations"));
            }
            failIfErrors();

            Invoker invoker = attempt(root, () -> Invoker.builder(id, name)
                    .description(optionalText("description"))
                    .hint(optionalText("hint"))
                    .icon(optionalText("icon"))
                    .authType(optionalText("authType"))
                    .categoryTags(children(child(root, "category_tags"), "item").stream()
                            .map(XmlElements::text).filter(tag -> !tag.isEmpty()).toList())
                    .settings(settings)
                    .operations(operations)
                    .build());
            failIfErrors();
            return new ReadResult(InvokerFormat.LEGACY_V5, invoker, issues);
        }

        private @Nullable String optionalText(String name) {
            return child(root, name).map(XmlElements::textOrNull).orElse(null);
        }

        // ── identity ─────────────────────────────────────

        private InvokerId deriveInvokerId(String name) {
            String ascii = Normalizer.normalize(name, Normalizer.Form.NFKD).replaceAll("\\p{M}", "");
            String slug = ascii.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "");
            if (slug.length() > 100) {
                slug = slug.substring(0, 100).replaceAll("-+$", "");
            }
            if (slug.isEmpty()) {
                fail(InvokerIssue.error("/invoker/name",
                        "the name '" + name + "' has no letters or digits to derive an invoker id from"));
            }
            issues.add(InvokerIssue.info("/invoker/name", "derived the invoker id '" + slug + "' from the name '"
                    + name + "'; connectors refer to the invoker by this id, which must not change"));
            return InvokerId.of(slug);
        }


        private void registerOperationId(Element element) {
            String name = attribute(element, "name");
            if (name == null || name.isBlank()) {
                issues.add(InvokerIssue.error(location(element), "the operation has no name"));
                return;
            }
            String id = name.trim().replaceAll("[^A-Za-z0-9_.\\-]+", "-").replaceAll("^-+|-+$", "");
            if (id.isEmpty()) {
                issues.add(InvokerIssue.error(location(element),
                        "the operation name '" + name + "' has no letters or digits to derive an operation id from"));
                return;
            }
            if (!id.equals(name)) {
                issues.add(InvokerIssue.warning(location(element), "the operation name '" + name
                        + "' is not a valid operation id; it was given the id '" + id + "'"));
            }
            if (operationIds.containsValue(OperationId.of(id))) {
                issues.add(InvokerIssue.error(location(element), "another operation already has the id '" + id + "'"));
                return;
            }
            operationIds.put(name, OperationId.of(id));
        }

        // ── settings ─────────────────────────────────────

        private ConnectorSetting setting(Element item) {
            String name = attribute(item, "name");
            ScalarType type = settingType(item);
            Visibility visibility = visibility(item);
            String value = textOrNull(item);
            if (visibility != Visibility.PRIVATE) {
                return attempt(item, () -> new ConnectorSetting(name, type, visibility, value, null));
            }
            if (value == null) {
                throw problem(item, "the private setting '" + name + "' has no value to derive it from");
            }
            String source = withRenamedOperations(item, value);
            return attempt(item, () -> new ConnectorSetting(name, type, Visibility.PRIVATE, null, source));
        }

        private ScalarType settingType(Element item) {
            String type = attribute(item, "type");
            if (type == null || type.isBlank() || type.equalsIgnoreCase("text")) {
                return ScalarType.STRING;
            }
            try {
                return ScalarType.fromValue(type);
            } catch (IllegalArgumentException e) {
                issues.add(InvokerIssue.warning(location(item), "unknown setting type '" + type + "'; treated as string"));
                return ScalarType.STRING;
            }
        }

        private Visibility visibility(Element item) {
            String visibility = attribute(item, "visibility");
            if (visibility == null || visibility.isBlank()) {
                issues.add(InvokerIssue.warning(location(item), "the setting has no visibility; treated as public"));
                return Visibility.PUBLIC;
            }
            try {
                return Visibility.fromValue(visibility);
            } catch (IllegalArgumentException e) {
                issues.add(InvokerIssue.warning(location(item),
                        "unknown visibility '" + visibility + "'; treated as public"));
                return Visibility.PUBLIC;
            }
        }

        /**
         * A 5.x private value is kept as written: the execution engine resolves it. The one change is for
         * operations whose name was not a valid id and was renamed; a reference such as
         * {@code %{Get Token.body.token}} still names the old name, so it is updated to the new id.
         */
        private String withRenamedOperations(Element item, String value) {
            String source = value;
            List<Map.Entry<String, OperationId>> renamed = operationIds.entrySet().stream()
                    .filter(entry -> !entry.getKey().equals(entry.getValue().value()))
                    .sorted(Comparator.comparingInt((Map.Entry<String, OperationId> entry) -> entry.getKey().length())
                            .reversed())
                    .toList();
            for (Map.Entry<String, OperationId> entry : renamed) {
                String reference = "%{" + entry.getKey() + ".";
                if (source.contains(reference)) {
                    source = source.replace(reference, "%{" + entry.getValue().value() + ".");
                    issues.add(InvokerIssue.info(location(item), "updated the reference to the operation '"
                            + entry.getKey() + "', which was given the id '" + entry.getValue() + "'"));
                }
            }
            return source;
        }

        // ── operations ───────────────────────────────────

        private Operation operation(Element element, @Nullable Pagination shared) {
            String name = attribute(element, "name");
            OperationId id = operationIds.get(name);
            if (id == null) {
                throw new XmlElements.ElementProblem(location(element), "the operation has no usable id");
            }
            Set<OperationRole> roles = roles(element);
            Element requestElement = child(element, "request")
                    .orElseThrow(() -> problem(element, "the operation has no <request>"));
            Request request = request(requestElement);
            List<Response> responses = responses(element);
            Pagination pagination = child(element, "pagination").map(this::pagination).orElse(shared);
            return attempt(element, () -> Operation.builder(id, name.trim())
                    .roles(roles)
                    .request(request)
                    .responses(responses)
                    .pagination(pagination)
                    .build());
        }

        private Set<OperationRole> roles(Element element) {
            String type = attribute(element, "type");
            if (type == null || type.isBlank()) {
                return Set.of();
            }
            Set<OperationRole> roles = EnumSet.noneOf(OperationRole.class);
            for (String token : type.trim().split("[\\s,]+")) {
                String role = token.toLowerCase(Locale.ROOT);
                if (role.equals("test")) {
                    roles.add(OperationRole.TEST);
                } else if (role.contains("auth")) {
                    roles.add(OperationRole.AUTH);
                } else if (!role.equals("page")) {
                    issues.add(InvokerIssue.warning(location(element),
                            "unknown operation type '" + token + "' was ignored"));
                }
            }
            return roles;
        }

        private Request request(Element element) {
            String method = child(element, "method").map(XmlElements::text).orElse("");
            String endpoint = child(element, "endpoint").map(XmlElements::text).orElse("");
            List<QueryParameter> parameters = new ArrayList<>();
            int query = endpoint.indexOf('?');
            if (query >= 0) {
                String queryString = endpoint.substring(query + 1);
                endpoint = endpoint.substring(0, query);
                for (String pair : queryString.split("&")) {
                    if (pair.isBlank()) {
                        continue;
                    }
                    int equals = pair.indexOf('=');
                    String name = equals < 0 ? pair : pair.substring(0, equals);
                    String value = equals < 0 ? null : pair.substring(equals + 1);
                    parameters.add(attempt(element, () ->
                            QueryParameter.of(name, new ScalarSchema(ScalarType.STRING, value))));
                }
                issues.add(InvokerIssue.warning(location(element), "moved the query string '" + queryString
                        + "' out of the endpoint into query parameters; check their types"));
            }

            HeaderSplit headers = headers(element, true);
            Body body = child(element, "body").flatMap(bodyElement -> body(bodyElement, headers.contentType(), true))
                    .orElse(null);
            reportContentTypeHeader(element, headers.contentType(), body);

            String finalEndpoint = endpoint;
            return attempt(element, () -> Request.builder(HttpMethod.fromValue(method), finalEndpoint)
                    .headers(headers.headers())
                    .parameters(parameters)
                    .body(body)
                    .build());
        }

        /** Headers, with {@code Content-Type} taken out: in the current format it belongs to the body. */
        private HeaderSplit headers(Element parent, boolean keepValues) {
            List<Header> headers = new ArrayList<>();
            String contentType = null;
            for (Element item : children(child(parent, "header"), "item")) {
                String name = attribute(item, "name");
                if (Header.CONTENT_TYPE.equalsIgnoreCase(name)) {
                    contentType = textOrNull(item);
                    continue;
                }
                headers.add(attempt(item, () -> Header.of(name, keepValues ? textOrNull(item) : null)));
            }
            return new HeaderSplit(headers, contentType);
        }

        private void reportContentTypeHeader(Element element, @Nullable String header, @Nullable Body body) {
            if (header == null) {
                return;
            }
            if (body == null) {
                issues.add(InvokerIssue.info(location(element),
                        "dropped the Content-Type header, because there is no body for it to describe"));
            } else {
                note("content-type", InvokerIssue.info("/invoker",
                        "Content-Type headers became the contentType of the bodies they describe"));
            }
        }

        // ── responses ────────────────────────────────────

        private List<Response> responses(Element operation) {
            Optional<Element> response = child(operation, "response");
            Response success = response.flatMap(element -> child(element, "success"))
                    .map(element -> result(element, true)).orElse(null);
            Response fail = response.flatMap(element -> child(element, "fail"))
                    .map(element -> result(element, false)).orElse(null);

            if (success == null && fail == null) {
                issues.add(InvokerIssue.warning(location(operation),
                        "the operation describes no response; added a default response without a body"));
                return List.of(Response.of(ResponseStatus.DEFAULT, null));
            }
            if (success != null && fail != null && success.status().equals(fail.status())) {
                issues.add(InvokerIssue.warning(location(operation), "success and fail both answer status "
                        + success.status().value() + ", so they were merged into one response. The status cannot "
                        + "tell them apart: add <condition success=\"…\"/>, for example body.error == null, "
                        + "or every failure will be treated as a success"));
                return List.of(merge(operation, success, fail));
            }
            List<Response> responses = new ArrayList<>();
            if (success != null) {
                responses.add(success);
            }
            if (fail != null) {
                responses.add(fail);
            }
            return responses;
        }

        private Response result(Element element, boolean success) {
            String status = attribute(element, "status");
            ResponseStatus responseStatus;
            if (status == null || status.isBlank()) {
                responseStatus = success ? ResponseStatus.parse("2XX") : ResponseStatus.DEFAULT;
                issues.add(InvokerIssue.warning(location(element), "no status given; treated as "
                        + responseStatus.value()));
            } else {
                responseStatus = attempt(element, () -> ResponseStatus.parse(status));
            }
            HeaderSplit headers = headers(element, false);
            Body body = child(element, "body").flatMap(bodyElement -> body(bodyElement, headers.contentType(), false))
                    .orElse(null);
            return attempt(element, () -> Response.builder(responseStatus).headers(headers.headers()).body(body).build());
        }

        /**
         * Joins the success and fail descriptions of one status: the success fields, plus the fail fields
         * that do not clash, so a workflow can bind to both the result and the error.
         */
        private Response merge(Element operation, Response success, Response fail) {
            List<Header> headers = new ArrayList<>(success.headers());
            fail.headers().stream()
                    .filter(header -> success.header(header.name()).isEmpty())
                    .forEach(headers::add);

            Body body = success.body();
            if (body == null) {
                body = fail.body();
            } else if (fail.body() != null
                    && body.schema() instanceof ObjectSchema successSchema
                    && fail.body().schema() instanceof ObjectSchema failSchema) {
                List<Field> fields = new ArrayList<>(successSchema.fields());
                for (Field field : failSchema.fields()) {
                    Optional<Field> existing = successSchema.field(field.name());
                    if (existing.isEmpty()) {
                        fields.add(field);
                    } else if (!existing.get().equals(field)) {
                        issues.add(InvokerIssue.warning(location(operation), "the field '" + field.name()
                                + "' differs between the success and fail bodies; kept the success version"));
                    }
                }
                ObjectSchema merged = new ObjectSchema(fields, successSchema.attributes());
                body = Body.builder(body.contentType())
                        .schema(merged)
                        .envelope(body.envelope())
                        .xmlNamespace(body.xmlNamespace())
                        .build();
            }
            return Response.builder(success.status()).headers(headers).body(body).build();
        }

        // ── bodies and fields ────────────────────────────

        /**
         * A 5.x body. 5.x ignored a body without attributes or without fields, so this does too.
         */
        private Optional<Body> body(Element element, @Nullable String headerContentType, boolean request) {
            List<Element> fields = children(element, "field");
            if (!element.hasAttributes() || fields.isEmpty()) {
                return Optional.empty();
            }
            String data = attribute(element, "data");
            String format = attribute(element, "format");
            BodyEnvelope envelope = "graphql".equalsIgnoreCase(data) ? BodyEnvelope.GRAPHQL : null;
            if (envelope != null && !request) {
                note("response-envelope", InvokerIssue.info("/invoker",
                        "dropped data=\"graphql\" from response bodies; a GraphQL response is plain JSON"));
                envelope = null;
            }
            ContentType contentType = contentType(element, headerContentType, data, format, envelope != null);

            ObjectSchema fieldsSchema = objectSchema(element, fields, request);
            Schema schema = "array".equalsIgnoreCase(attribute(element, "type"))
                    ? new ArraySchema(fieldsSchema, List.of())
                    : fieldsSchema;
            BodyEnvelope finalEnvelope = envelope;
            return Optional.of(attempt(element, () ->
                    Body.builder(contentType).schema(schema).envelope(finalEnvelope).build()));
        }

        /**
         * The media type, from the most explicit source available: a Content-Type header, a media type in
         * {@code data}, then {@code format}.
         */
        private ContentType contentType(Element element, @Nullable String header, @Nullable String data,
                                        @Nullable String format, boolean graphql) {
            if (header != null && !header.contains("{")) {
                try {
                    return ContentType.parse(header);
                } catch (IllegalArgumentException e) {
                    issues.add(InvokerIssue.warning(location(element),
                            "ignored the unreadable Content-Type header '" + header + "'"));
                }
            }
            if (data != null && data.contains("/")) {
                try {
                    return ContentType.parse(data);
                } catch (IllegalArgumentException e) {
                    issues.add(InvokerIssue.warning(location(element), "ignored the unreadable data '" + data + "'"));
                }
            }
            if (graphql) {
                return ContentType.APPLICATION_JSON;
            }
            ContentType fromFormat = switch (format == null ? "" : format.toLowerCase(Locale.ROOT)) {
                case "json" -> ContentType.APPLICATION_JSON;
                case "xml" -> ContentType.APPLICATION_XML;
                case "text" -> ContentType.TEXT_PLAIN;
                case "x-www-form-urlencoded" -> ContentType.APPLICATION_FORM_URLENCODED;
                default -> null;
            };
            if (fromFormat != null) {
                return fromFormat;
            }
            issues.add(InvokerIssue.warning(location(element), "the body states no recognisable media type "
                    + "(format='" + format + "'); assumed application/json"));
            return ContentType.APPLICATION_JSON;
        }

        private ObjectSchema objectSchema(Element parent, List<Element> fieldElements, boolean request) {
            List<Field> fields = new ArrayList<>();
            List<XmlAttribute> attributes = new ArrayList<>();
            for (Element element : fieldElements) {
                String name = attribute(element, "name");
                if (element.hasAttribute("required")) {
                    note("required", InvokerIssue.info("/invoker",
                            "dropped 'required' attributes; the current format does not use them"));
                }
                if ("__oc__attributes".equals(name)) {
                    for (Element attributeElement : children(element, "field")) {
                        attributes.add(attempt(attributeElement, () -> XmlAttribute.of(
                                attribute(attributeElement, "name"),
                                new ScalarSchema(scalarType(attributeElement), request ? scalarDefault(attributeElement) : null))));
                    }
                } else if ("__oc__value".equals(name)) {
                    issues.add(InvokerIssue.warning(location(element), "the text of an XML element that also has "
                            + "attributes cannot be described in the current format and was dropped"));
                } else {
                    fields.add(attempt(element, () -> Field.of(name, fieldSchema(element, request))));
                }
            }
            return attempt(parent, () -> new ObjectSchema(fields, attributes));
        }

        private Schema fieldSchema(Element element, boolean request) {
            String type = attribute(element, "type");
            String normalized = type == null ? "" : type.trim().toLowerCase(Locale.ROOT);
            List<Element> children = children(element, "field");
            return switch (normalized) {
                case "object" -> objectSchema(element, children, request);
                case "array" -> arraySchema(element, children, request);
                case "string", "number", "integer", "boolean" -> scalar(element, children, request);
                default -> {
                    if (!children.isEmpty()) {
                        issues.add(InvokerIssue.warning(location(element), "the field has "
                                + (normalized.isEmpty() ? "no type" : "the unknown type '" + type + "'")
                                + " but contains fields; treated as an object"));
                        yield objectSchema(element, children, request);
                    }
                    issues.add(InvokerIssue.warning(location(element), "the field has "
                            + (normalized.isEmpty() ? "no type" : "the unknown type '" + type + "'")
                            + "; treated as a string"));
                    yield scalar(element, children, request);
                }
            };
        }

        private Schema arraySchema(Element element, List<Element> children, boolean request) {
            if (!children.isEmpty()) {
                return new ArraySchema(objectSchema(element, children, request), List.of());
            }
            String text = text(element);
            if (!text.isEmpty()) {
                List<Value> defaults = request
                        ? Arrays.stream(text.split(",")).map(String::trim).<Value>map(Value.TextValue::new).toList()
                        : List.of();
                if (!request) {
                    noteResponseValues();
                }
                issues.add(InvokerIssue.info(location(element),
                        "the comma-separated values became a list of strings with default values"));
                return new ArraySchema(Schema.string(), defaults);
            }
            issues.add(InvokerIssue.warning(location(element), "the array does not say what its elements are; "
                    + "they are described as undefined until the element type is filled in"));
            return new ArraySchema(UndefinedSchema.INSTANCE, List.of());
        }

        private ScalarSchema scalar(Element element, List<Element> children, boolean request) {
            if (!children.isEmpty()) {
                issues.add(InvokerIssue.warning(location(element),
                        "a " + attribute(element, "type") + " field cannot contain fields; they were ignored"));
            }
            String value = scalarDefault(element);
            if (!request && value != null) {
                noteResponseValues();
                value = null;
            }
            return new ScalarSchema(scalarType(element), value);
        }

        private ScalarType scalarType(Element element) {
            String type = attribute(element, "type");
            try {
                return type == null || type.isBlank() ? ScalarType.STRING : ScalarType.fromValue(type);
            } catch (IllegalArgumentException e) {
                return ScalarType.STRING;
            }
        }

        /** 5.x treated the text {@code null} as no value. */
        private static @Nullable String scalarDefault(Element element) {
            String value = textOrNull(element);
            return "null".equals(value) ? null : value;
        }

        private void noteResponseValues() {
            note("response-values", InvokerIssue.info("/invoker",
                    "dropped example values from response schemas; a response describes shape, not data"));
        }

        // ── pagination ───────────────────────────────────

        private @Nullable Pagination pagination(Element element) {
            List<PageRule> rules = new ArrayList<>();
            for (Element ruleElement : children(element)) {
                PageParam param;
                try {
                    param = PageParam.fromValue(ruleElement.getLocalName());
                } catch (IllegalArgumentException e) {
                    issues.add(InvokerIssue.warning(location(ruleElement),
                            "unknown pagination element <" + ruleElement.getLocalName() + "> was skipped"));
                    continue;
                }
                String action = attribute(ruleElement, "action");
                PageAction pageAction;
                try {
                    pageAction = PageAction.fromValue(action == null ? "" : action);
                } catch (IllegalArgumentException e) {
                    issues.add(InvokerIssue.warning(location(ruleElement), "the rule has "
                            + (action == null ? "no action" : "the unknown action '" + action + "'") + " and was skipped"));
                    continue;
                }
                String ref = attribute(ruleElement, "ref");
                String value = textOrNull(ruleElement);
                if (value == null && ref == null) {
                    if (!ZERO_DEFAULTED.contains(param)) {
                        issues.add(InvokerIssue.warning(location(ruleElement),
                                "the rule has neither a value nor a ref and was skipped"));
                        continue;
                    }
                    value = "0";
                }
                String finalValue = value;
                rules.add(attempt(ruleElement, () -> new PageRule(param, pageAction, finalValue, ref)));
            }
            if (rules.isEmpty()) {
                issues.add(InvokerIssue.warning(location(element), "no usable pagination rules; pagination dropped"));
                return null;
            }
            return attempt(element, () -> new Pagination(rules));
        }

        /** 5.x applied invoker-level pagination to every operation without its own, and so does the upgrade. */
        private void reportSharedPagination(@Nullable Pagination shared, List<Element> operations) {
            if (shared == null) {
                return;
            }
            long inherited = operations.stream().filter(operation -> child(operation, "pagination").isEmpty()).count();
            issues.add(InvokerIssue.info("/invoker/pagination", "the invoker-level pagination was copied to the "
                    + inherited + " operation(s) without their own, which is how 5.x applied it"));
        }

        // ── plumbing ─────────────────────────────────────

        private <T> List<T> convertAll(List<Element> elements, java.util.function.Function<Element, T> converter) {
            List<T> result = new ArrayList<>();
            for (Element element : elements) {
                try {
                    result.add(converter.apply(element));
                } catch (XmlElements.ElementProblem problem) {
                    issues.add(problem.toIssue());
                } catch (IllegalArgumentException | NullPointerException e) {
                    issues.add(InvokerIssue.error(location(element), String.valueOf(e.getMessage())));
                }
            }
            return result;
        }

        /** Builds a model value, reporting a rejected rule against the element being converted. */
        private <T> T attempt(Element element, Supplier<T> construction) {
            try {
                return build(element, construction);
            } catch (XmlElements.ElementProblem problem) {
                if (element == root) {
                    issues.add(problem.toIssue());
                    fail(null);
                }
                throw problem;
            }
        }

        private XmlElements.ElementProblem problem(Element element, String message) {
            return new XmlElements.ElementProblem(location(element), message);
        }

        /** Adds a file-wide note only the first time it applies. */
        private void note(String key, InvokerIssue issue) {
            if (onceNotes.add(key)) {
                issues.add(issue);
            }
        }

        private void failIfErrors() {
            if (issues.stream().anyMatch(issue -> issue.severity() == InvokerIssue.Severity.ERROR)) {
                fail(null);
            }
        }

        private void fail(@Nullable InvokerIssue issue) {
            if (issue != null) {
                issues.add(issue);
            }
            throw new InvokerReadException(InvokerFormat.LEGACY_V5, issues);
        }
    }

    private record HeaderSplit(List<Header> headers, @Nullable String contentType) {
    }
}
