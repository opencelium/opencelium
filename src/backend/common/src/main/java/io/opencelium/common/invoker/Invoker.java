package io.opencelium.common.invoker;

import io.opencelium.common.invoker.operation.Operation;
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
 * <p>Beyond validating each part, an invoker checks that setting names and operation ids are unique.
 * Setting sources are expressions resolved by the execution engine, so references inside them are
 * not checked here.
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
 * @param operations   what the API offers, at least one, with unique ids
 */
public record Invoker(
        String id,
        String name,
        String description,
        String hint,
        String icon,
        String authType,
        Set<String> categoryTags,
        List<ConnectorSetting> settings,
        List<Operation> operations) {

    public Invoker {
        Objects.requireNonNull(id, "invoker id must not be null");
        Objects.requireNonNull(name, "name of invoker '" + id + "' must not be null");
        Objects.requireNonNull(categoryTags, "category tags of invoker '" + id + "' must not be null");
        Objects.requireNonNull(settings, "settings of invoker '" + id + "' must not be null");
        Objects.requireNonNull(operations, "operations of invoker '" + id + "' must not be null");
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
        operations = List.copyOf(operations);
        if (operations.isEmpty()) {
            throw new IllegalArgumentException("invoker '" + id + "' must offer at least one operation");
        }
        requireUniqueSettingNames(id, settings);
        requireUniqueOperationIds(id, operations);
    }

    /** The operation with this id. */
    public Optional<Operation> operation(String operationId) {
        return operations.stream().filter(operation -> operation.id().equals(operationId)).findFirst();
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

    private static void requireUniqueOperationIds(String id, List<Operation> operations) {
        Set<String> seen = new HashSet<>();
        for (Operation operation : operations) {
            if (!seen.add(operation.id())) {
                throw new IllegalArgumentException("invoker '" + id + "' declares operation '"
                        + operation.id() + "' more than once");
            }
        }
    }
}
