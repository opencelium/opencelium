package io.opencelium.common.invoker;

import io.opencelium.common.invoker.operation.Operation;
import io.opencelium.common.invoker.operation.OperationId;
import io.opencelium.common.invoker.operation.OperationRole;
import io.opencelium.common.invoker.setting.ConnectorSetting;
import org.jspecify.annotations.Nullable;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.SequencedSet;
import java.util.Set;

/**
 * The description of one external API.
 *
 * <p>Beyond validating each part, an invoker checks that setting names and operation ids are unique.
 * Setting sources are expressions resolved by the execution engine, so references inside them are
 * not checked here.
 *
 * <p>Build one with {@link #builder}, which names every part instead of relying on argument order:
 * <pre>{@code
 * Invoker invoker = Invoker.builder(InvokerId.of("service-desk"), "Service Desk")
 *         .hint("Enter your instance URL")
 *         .setting(ConnectorSetting.ofPublic("url"))
 *         .operation(Operation.builder("listTickets", "List tickets")
 *                 .request(Request.builder(HttpMethod.GET, "{url}/tickets"))
 *                 .response(Response.of(ResponseStatus.of(200))))
 *         .build();
 * }</pre>
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
        InvokerId id,
        String name,
        @Nullable String description,
        @Nullable String hint,
        @Nullable String icon,
        @Nullable String authType,
        SequencedSet<String> categoryTags,
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

        SequencedSet<String> tags = new LinkedHashSet<>();
        for (String tag : categoryTags) {
            Objects.requireNonNull(tag, "category tag of invoker '" + id + "' must not be null");
            if (tag.isBlank()) {
                throw new IllegalArgumentException("category tag of invoker '" + id + "' must not be blank");
            }
            tags.add(tag);
        }
        categoryTags = Collections.unmodifiableSequencedSet(tags);

        settings = List.copyOf(settings);
        operations = List.copyOf(operations);
        if (operations.isEmpty()) {
            throw new IllegalArgumentException("invoker '" + id + "' must offer at least one operation");
        }
        requireUniqueSettingNames(id, settings);
        requireUniqueOperationIds(id, operations);
    }

    /** The operation with this id. */
    public Optional<Operation> operation(OperationId operationId) {
        return operations.stream().filter(operation -> operation.id().equals(operationId)).findFirst();
    }

    /** The setting with exactly this name. */
    public Optional<ConnectorSetting> setting(String settingName) {
        return settings.stream().filter(setting -> setting.name().equals(settingName)).findFirst();
    }

    /** The operations serving a role, in declaration order; for example the one used to test a connection. */
    public List<Operation> operationsWithRole(OperationRole role) {
        return operations.stream().filter(operation -> operation.hasRole(role)).toList();
    }

    private static void requireUniqueSettingNames(InvokerId id, List<ConnectorSetting> settings) {
        Set<String> seen = new HashSet<>();
        for (ConnectorSetting setting : settings) {
            if (!seen.add(setting.name())) {
                throw new IllegalArgumentException("invoker '" + id + "' declares setting '"
                        + setting.name() + "' more than once");
            }
        }
    }

    private static void requireUniqueOperationIds(InvokerId id, List<Operation> operations) {
        Set<OperationId> seen = new HashSet<>();
        for (Operation operation : operations) {
            if (!seen.add(operation.id())) {
                throw new IllegalArgumentException("invoker '" + id + "' declares operation '"
                        + operation.id() + "' more than once");
            }
        }
    }

    /** Starts an invoker with its two required parts. */
    public static Builder builder(InvokerId id, String name) {
        return new Builder(id, name);
    }

    /**
     * Collects the parts of an invoker. {@link #build()} applies every rule of the {@link Invoker}
     * constructor, so a builder can never produce an invalid invoker.
     */
    public static final class Builder {

        private final InvokerId id;
        private final String name;
        private @Nullable String description;
        private @Nullable String hint;
        private @Nullable String icon;
        private @Nullable String authType;
        private final SequencedSet<String> categoryTags = new LinkedHashSet<>();
        private final List<ConnectorSetting> settings = new ArrayList<>();
        private final List<Operation> operations = new ArrayList<>();

        private Builder(InvokerId id, String name) {
            this.id = id;
            this.name = name;
        }

        public Builder description(@Nullable String description) {
            this.description = description;
            return this;
        }

        public Builder hint(@Nullable String hint) {
            this.hint = hint;
            return this;
        }

        public Builder icon(@Nullable String icon) {
            this.icon = icon;
            return this;
        }

        public Builder authType(@Nullable String authType) {
            this.authType = authType;
            return this;
        }

        public Builder categoryTag(String tag) {
            categoryTags.add(Objects.requireNonNull(tag, "category tag must not be null"));
            return this;
        }

        public Builder categoryTags(Collection<String> tags) {
            tags.forEach(this::categoryTag);
            return this;
        }

        public Builder setting(ConnectorSetting setting) {
            settings.add(Objects.requireNonNull(setting, "setting must not be null"));
            return this;
        }

        public Builder settings(Collection<ConnectorSetting> settings) {
            settings.forEach(this::setting);
            return this;
        }

        public Builder operation(Operation operation) {
            operations.add(Objects.requireNonNull(operation, "operation must not be null"));
            return this;
        }

        /** Adds an operation that is still being built. */
        public Builder operation(Operation.Builder operation) {
            return operation(operation.build());
        }

        public Builder operations(Collection<Operation> operations) {
            operations.forEach(this::operation);
            return this;
        }

        /**
         * @throws IllegalArgumentException if the parts break a rule of {@link Invoker}
         */
        public Invoker build() {
            return new Invoker(id, name, description, hint, icon, authType, categoryTags, settings, operations);
        }
    }
}
