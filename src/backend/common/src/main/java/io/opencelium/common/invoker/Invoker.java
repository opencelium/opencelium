package io.opencelium.common.invoker;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Objects;
import java.util.Set;

/**
 * The description of one external API.
 *
 * <p>The id is what everything else refers to: connectors are stored against it, and it must not change
 * once an invoker is in use. The name is only a label, so it can be corrected or translated freely.
 *
 * @param id           the permanent identifier; connectors are stored against it
 * @param name         the label users see; safe to change
 * @param description  what the service is, or {@code null}
 * @param hint         advice shown on the connection form, or {@code null}
 * @param icon         an icon file name, or {@code null}
 * @param authType     a descriptive label such as {@code basic} or {@code token}, or {@code null};
 *                     it does not affect how requests are authenticated
 * @param categoryTags grouping tags, unique and in declaration order
 */
public record Invoker(
        String id,
        String name,
        String description,
        String hint,
        String icon,
        String authType,
        Set<String> categoryTags) {

    public Invoker {
        Objects.requireNonNull(id, "invoker id must not be null");
        Objects.requireNonNull(name, "name of invoker '" + id + "' must not be null");
        Objects.requireNonNull(categoryTags, "category tags of invoker '" + id + "' must not be null");
        if (name.isBlank()) {
            throw new IllegalArgumentException("name of invoker '" + id + "' must not be blank");
        }

        Set<String> tags = new LinkedHashSet<>();
        for (String tag : categoryTags) {
            Objects.requireNonNull(tag, "category tag of invoker '" + id + "' must not be null");
            if (tag.isBlank()) {
                throw new IllegalArgumentException("category tag of invoker '" + id + "' must not be blank");
            }
            tags.add(tag);
        }
        categoryTags = Collections.unmodifiableSet(tags);
    }
}
