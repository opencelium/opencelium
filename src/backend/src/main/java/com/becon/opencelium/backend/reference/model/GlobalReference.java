package com.becon.opencelium.backend.reference.model;

import com.becon.opencelium.backend.constant.RegExpression;
import com.becon.opencelium.backend.reference.enums.ReferenceType;

import java.util.Objects;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.becon.opencelium.backend.reference.enums.ReferenceType.GLOBAL;

/**
 * Represents a global variable reference.
 *
 * <p>Syntax:
 * <pre>{@code
 * {{global.name}}
 * {{global.name.path}}
 * {{global.name[index].path}}
 * }</pre>
 *
 * <p>The {@code name} is the unique name of the variable: letters, digits and {@code _},
 * starting with a letter. The optional {@code path} points into a value that is an array or a
 * map.
 *
 * <p>Examples:
 * <pre>{@code
 * {{global.idoitUrl}}
 * {{global.limits.maxPerPage}}
 * {{global.tenants[0].id}}
 * }</pre>
 */
public final class GlobalReference implements Reference {
    private static final Pattern SYNTAX = Pattern.compile(RegExpression.globalRef);

    private final String raw;
    private final String name;
    private final String path;

    private GlobalReference(String raw, String name, String path) {
        this.raw = raw;
        this.name = name;
        this.path = path;
    }

    @Override
    public ReferenceType getType() {
        return GLOBAL;
    }

    @Override
    public String getRaw() {
        return raw;
    }

    public String getName() {
        return name;
    }

    /**
     * Returns the path into the value, without the dot that separates it from the name:
     * {@code limits.maxPerPage} reads {@code maxPerPage}, {@code tenants[0].id} reads
     * {@code [0].id}. Empty when the reference reads the whole value.
     */
    public Optional<String> getPath() {
        return Optional.ofNullable(path);
    }

    /**
     * Parses a raw global variable reference into a {@link GlobalReference}.
     *
     * <p>Expected syntax:
     * <pre>{@code
     * {{global.name}}
     * {{global.name.path}}
     * {{global.name[index].path}}
     * }</pre>
     *
     * @param rawReference raw global variable reference
     * @return parsed {@link GlobalReference}
     * @throws NullPointerException     if {@code rawReference} is {@code null}
     * @throws IllegalArgumentException if the syntax is invalid or the path is empty
     */
    public static GlobalReference parse(String rawReference) {
        Objects.requireNonNull(rawReference, "null is not a reference");

        Matcher matcher = SYNTAX.matcher(rawReference);
        if (!matcher.matches()) {
            throw new IllegalArgumentException("Invalid syntax for " + GLOBAL + " reference: " + rawReference);
        }

        String name = matcher.group(1);
        String pathPart = matcher.group(2);
        if (pathPart == null) {
            return new GlobalReference(rawReference, name, null);
        }

        // '.maxPerPage' is a field of the value, '[0].id' starts with an index
        String path = pathPart.startsWith(".") ? pathPart.substring(1) : pathPart;
        if (path.isBlank()) {
            throw new IllegalArgumentException("Empty path in " + GLOBAL + " reference: " + rawReference);
        }

        return new GlobalReference(rawReference, name, path);
    }
}
