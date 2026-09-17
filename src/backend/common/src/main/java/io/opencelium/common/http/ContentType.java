package io.opencelium.common.http;

import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * A media type such as {@code application/json}: the {@code type/subtype} pair that says how a body
 * is encoded.
 *
 * <p>Parameters such as {@code charset} or {@code boundary} are dropped when parsing. They describe
 * a particular message on the wire, not the format an operation expects, and keeping them would make
 * {@code application/json} and {@code application/json; charset=utf-8} compare as different types.
 *
 * <p>Media types are case-insensitive (RFC 9110 §8.3.1), so both parts are stored in lower case and
 * two instances compare equal regardless of how they were written.
 *
 * <h2>Family checks</h2>
 * The {@code isJson()} and {@code isXml()} checks follow the structured syntax suffix convention of
 * RFC 6839, so {@code application/vnd.api+json} and {@code application/problem+json} count as JSON,
 * and {@code application/atom+xml} counts as XML. A type can belong to more than one family:
 * {@code text/xml} is both text and XML.
 */
public record ContentType(String type, String subtype) {

    /**
     * Both halves of a media type are a {@code token} as defined in RFC 9110 §5.6.2.
     *
     * <p>Declared before the constants below: static fields initialise in textual order, and those
     * constants run the constructor, which needs this pattern.
     */
    private static final Pattern TOKEN = Pattern.compile("[!#$%&'*+\\-.^_`|~0-9A-Za-z]+");

    public static final ContentType APPLICATION_JSON = new ContentType("application", "json");
    public static final ContentType APPLICATION_XML = new ContentType("application", "xml");
    public static final ContentType APPLICATION_FORM_URLENCODED =
            new ContentType("application", "x-www-form-urlencoded");
    public static final ContentType APPLICATION_OCTET_STREAM = new ContentType("application", "octet-stream");
    public static final ContentType MULTIPART_FORM_DATA = new ContentType("multipart", "form-data");
    public static final ContentType TEXT_PLAIN = new ContentType("text", "plain");

    public ContentType {
        Objects.requireNonNull(type, "media type must not be null");
        Objects.requireNonNull(subtype, "media subtype must not be null");
        type = type.toLowerCase(Locale.ROOT);
        subtype = subtype.toLowerCase(Locale.ROOT);
        if (!TOKEN.matcher(type).matches() || !TOKEN.matcher(subtype).matches()) {
            throw new IllegalArgumentException("'" + type + "/" + subtype + "' is not a valid media type");
        }
    }

    /**
     * Parses a media type as written in a {@code Content-Type} header or an invoker file, for example
     * {@code application/json} or {@code text/plain; charset=utf-8}.
     *
     * @throws IllegalArgumentException if the text is not of the form {@code type/subtype}
     */
    public static ContentType parse(String value) {
        Objects.requireNonNull(value, "media type must not be null");
        String essence = value.split(";", 2)[0].trim();
        int slash = essence.indexOf('/');
        if (slash <= 0 || slash == essence.length() - 1) {
            throw new IllegalArgumentException("'" + value + "' is not a media type; "
                    + "expected type/subtype, for example application/json");
        }
        return new ContentType(essence.substring(0, slash), essence.substring(slash + 1));
    }

    /**
     * The structured syntax suffix, if any: {@code json} for {@code application/vnd.api+json}.
     */
    public Optional<String> suffix() {
        int plus = subtype.lastIndexOf('+');
        return plus < 0 ? Optional.empty() : Optional.of(subtype.substring(plus + 1));
    }

    /** {@code application/json}, {@code text/json}, or any {@code +json} type. */
    public boolean isJson() {
        return isFamily("json");
    }

    /** {@code application/xml}, {@code text/xml}, or any {@code +xml} type. */
    public boolean isXml() {
        return isFamily("xml");
    }

    /** {@code application/x-www-form-urlencoded}: a flat list of named fields, sent as one string. */
    public boolean isFormUrlEncoded() {
        return equals(APPLICATION_FORM_URLENCODED);
    }

    /** Any {@code multipart/*} type: a body made of several independently encoded parts. */
    public boolean isMultipart() {
        return type.equals("multipart");
    }

    /** Any {@code text/*} type. */
    public boolean isText() {
        return type.equals("text");
    }

    private boolean isFamily(String family) {
        return subtype.equals(family) || suffix().filter(family::equals).isPresent();
    }

    /** The canonical {@code type/subtype} form, for example {@code application/json}. */
    @Override
    public String toString() {
        return type + "/" + subtype;
    }
}
