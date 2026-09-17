package io.opencelium.common.invoker.setting;

import io.opencelium.common.invoker.schema.ScalarType;
import org.jspecify.annotations.Nullable;

import java.util.Objects;
import java.util.regex.Pattern;

/**
 * One value a connector needs, declared by the invoker and supplied per connector.
 *
 * <p>In an invoker file:
 * <pre>{@code
 * <requiredData>
 *     <item name="url"      type="string" visibility="public">https://acme.example.com</item>
 *     <item name="password" type="string" visibility="protected"/>
 *     <item name="token"    type="string" visibility="private" source="%{login.body.token}"/>
 *     <item name="auth"     type="string" visibility="private" source="{username:password}"/>
 * </requiredData>
 * }</pre>
 *
 * <p>A source is kept exactly as written. It is an expression the execution engine resolves when a
 * workflow runs, so it is not parsed or checked here: a source that names a missing operation or
 * setting surfaces at execution, not at import.
 *
 * <p>A setting is derived if and only if it is private: a private setting must have a source, and a
 * setting with a source must be private. This keeps the two facts from contradicting each other,
 * since a value the user is asked for cannot also be computed.
 *
 * @param name         referenced elsewhere as {@code {name}}; letters, digits, '.', '_' and '-'
 * @param type         the value's type; almost always {@link ScalarType#STRING}
 * @param visibility   how the setting is presented and stored
 * @param defaultValue pre-filled value for a public or protected setting, or {@code null}
 * @param source       the expression a private setting is derived from, such as
 *                     {@code %{login.body.token}}; {@code null} for every other visibility
 */
public record ConnectorSetting(
        String name,
        ScalarType type,
        Visibility visibility,
        @Nullable String defaultValue,
        @Nullable String source) {

    /** Excludes the braces and colon that would break {@code {name}} and {@code {a:b}} syntax. */
    private static final Pattern NAME = Pattern.compile("[A-Za-z0-9_.\\-]+");

    public ConnectorSetting {
        Objects.requireNonNull(name, "setting name must not be null");
        Objects.requireNonNull(type, "type of setting '" + name + "' must not be null");
        Objects.requireNonNull(visibility, "visibility of setting '" + name + "' must not be null");
        if (source != null && source.isBlank()) {
            throw new IllegalArgumentException("source of setting '" + name + "' must not be blank");
        }
        if (!NAME.matcher(name).matches()) {
            throw new IllegalArgumentException("'" + name + "' is not a valid setting name; "
                    + "use letters, digits, '.', '_' and '-'");
        }
        if (visibility == Visibility.PRIVATE) {
            if (source == null) {
                throw new IllegalArgumentException("setting '" + name
                        + "' is private, so it is never asked for and needs a source to derive it from");
            }
            if (defaultValue != null) {
                throw new IllegalArgumentException("setting '" + name
                        + "' is private, so its value comes from its source and cannot have a default");
            }
        } else if (source != null) {
            throw new IllegalArgumentException("setting '" + name + "' has a source, so it is derived and must be "
                    + "private, not " + visibility.value());
        }
    }

    /** A setting the user supplies and can read back. */
    public static ConnectorSetting ofPublic(String name) {
        return new ConnectorSetting(name, ScalarType.STRING, Visibility.PUBLIC, null, null);
    }

    /** A credential the user supplies; masked and encrypted. */
    public static ConnectorSetting ofProtected(String name) {
        return new ConnectorSetting(name, ScalarType.STRING, Visibility.PROTECTED, null, null);
    }

    /** A setting OpenCelium derives and the user never sees. */
    public static ConnectorSetting ofPrivate(String name, String source) {
        return new ConnectorSetting(name, ScalarType.STRING, Visibility.PRIVATE, null, source);
    }

    /** Whether the connector form asks the user for this setting. */
    public boolean isPrompted() {
        return visibility != Visibility.PRIVATE;
    }
}
