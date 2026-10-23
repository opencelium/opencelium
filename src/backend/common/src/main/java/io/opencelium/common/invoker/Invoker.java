package io.opencelium.common.invoker;

import io.opencelium.common.invoker.setting.ConnectorSetting;

import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

/**
 * The description of one external API.
 *
 * <p>The id is what everything else refers to: connectors are stored against it, and it must not change
 * once an invoker is in use. The name is only a label, so it can be corrected or translated freely.
 *
 * <p>Beyond validating each part, an invoker checks that setting names are unique.
 *
 * @param id           the permanent identifier; connectors are stored against it
 * @param name         the label users see; safe to change
 * @param description  what the service is, or {@code null}
 * @param hint         advice shown on the connection form, or {@code null}
 * @param icon         an icon file name, or {@code null}
 * @param authType     a descriptive label such as {@code basic} or {@code token}, or {@code null};
 *                     it does not affect how requests are authenticated
 * @param categoryTags grouping tags, unique and in declaration order
 * @param settings     what a connector needs, with unique names
 */
public record Invoker(
        String id,
        String name,
        String description,
        String hint,
        String icon,
        String authType,
        Set<String> categoryTags,
        List<ConnectorSetting> settings) {

    public Invoker {
        Objects.requireNonNull(id, "invoker id must not be null");
        Objects.requireNonNull(name, "name of invoker '" + id + "' must not be null");
        Objects.requireNonNull(categoryTags, "category tags of invoker '" + id + "' must not be null");
        Objects.requireNonNull(settings, "settings of invoker '" + id + "' must not be null");
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

        settings = List.copyOf(settings);
        requireUniqueSettingNames(id, settings);
    }

    /** The setting with this name. */
    public Optional<ConnectorSetting> setting(String settingName) {
        return settings.stream().filter(setting -> setting.name().equals(settingName)).findFirst();
    }

    private static void requireUniqueSettingNames(String id, List<ConnectorSetting> settings) {
        Set<String> seen = new HashSet<>();
        for (ConnectorSetting setting : settings) {
            if (!seen.add(setting.name())) {
                throw new IllegalArgumentException("invoker '" + id + "' declares setting '"
                        + setting.name() + "' more than once");
            }
        }
    }
}
