package io.opencelium.common.invoker.setting;

import io.opencelium.common.invoker.schema.ScalarType;

import java.util.Objects;

/**
 * One value a connector needs, declared by the invoker and supplied per connector.
 *
 * <p>A source is kept exactly as written. It is an expression the execution engine resolves when a
 * workflow runs, so it is not parsed or checked here: a source that names a missing operation or
 * setting surfaces at execution, not at import.
 *
 * @param name         referenced elsewhere as {@code {name}}; letters, digits, '.', '_' and '-'
 * @param type         the value's type; almost always {@link ScalarType#STRING}
 * @param visibility   how the setting is presented and stored
 * @param defaultValue pre-filled value for a public or protected setting, or {@code null}
 */
public record ConnectorSetting(
        String name,
        ScalarType type,
        String visibility,
        String defaultValue,
        String source) {

    public ConnectorSetting {
        Objects.requireNonNull(name, "setting name must not be null");
        Objects.requireNonNull(type, "type of setting '" + name + "' must not be null");
        Objects.requireNonNull(visibility, "visibility of setting '" + name + "' must not be null");
        if (source != null && source.isBlank()) {
            throw new IllegalArgumentException("source of setting '" + name + "' must not be blank");
        }
        if ("private".equals(visibility)) {
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
                    + "private, not " + visibility);
        }
    }
}
