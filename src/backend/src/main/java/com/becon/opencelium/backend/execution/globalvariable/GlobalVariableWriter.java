package com.becon.opencelium.backend.execution.globalvariable;

import com.becon.opencelium.backend.constant.RegExpression;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableChange;
import com.becon.opencelium.backend.database.mysql.repository.GlobalVariableChangeRepository;
import com.becon.opencelium.backend.database.mysql.repository.GlobalVariableRepository;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableKind;
import com.becon.opencelium.backend.exception.GlobalVariableNotFoundException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.NullNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Writes mutable global variables for running executions, and reads their current value live.
 *
 * <p>Only a run of a variable's owner workflow may write it. A write replaces the whole current
 * value in one statement and records when and by which execution it was written. A test run, which
 * runs a copy of the workflow, is checked as its origin but stores nothing: its writes reach only
 * the run's own copy of the values, so testing never moves a value a production run relies on.
 *
 * <p>Any run may read the current value as the store holds it at that moment, so a run sees what
 * a run of the owner workflow wrote after it started.
 *
 * <p>The change log gets one entry per run and variable, however often the run wrote: see {@link
 * Run#logWrites()}.
 */
@Component
public class GlobalVariableWriter {

    /** How many RUN_WRITE entries the change log keeps per variable unless configured. */
    public static final int DEFAULT_MAX_RUN_ENTRIES = 200;

    private static final Logger log = LoggerFactory.getLogger(GlobalVariableWriter.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final GlobalVariableRepository repository;
    private final GlobalVariableChangeRepository changeRepository;
    private final TestRunOrigins testRunOrigins;
    private final int maxValueBytes;
    private final Duration scriptTimeLimit;
    private final int maxRunEntries;

    /**
     * @param scriptTimeoutMs how long an enhancement that imports a script variable may run
     * @param maxRunEntries   how many RUN_WRITE entries the change log keeps per variable, at
     *                        least one
     */
    @Autowired
    public GlobalVariableWriter(GlobalVariableRepository repository, GlobalVariableChangeRepository changeRepository,
            TestRunOrigins testRunOrigins,
            @Value("${opencelium.global-variable.max-value-bytes:65536}") int maxValueBytes,
            @Value("${opencelium.global-variable.script-timeout-ms:5000}") long scriptTimeoutMs,
            @Value("${opencelium.global-variable.change-log.max-run-entries:" + DEFAULT_MAX_RUN_ENTRIES + "}")
            int maxRunEntries) {
        this.repository = repository;
        this.changeRepository = changeRepository;
        this.testRunOrigins = testRunOrigins;
        this.maxValueBytes = maxValueBytes;
        this.scriptTimeLimit = Duration.ofMillis(scriptTimeoutMs);
        this.maxRunEntries = Math.max(maxRunEntries, 1);
    }

    /**
     * Creates a writer whose runs give scripts {@link GlobalScript#DEFAULT_TIME_LIMIT} and whose
     * change log keeps {@link #DEFAULT_MAX_RUN_ENTRIES} entries of run writes per variable.
     */
    public GlobalVariableWriter(GlobalVariableRepository repository, GlobalVariableChangeRepository changeRepository,
            TestRunOrigins testRunOrigins, int maxValueBytes) {
        this(repository, changeRepository, testRunOrigins, maxValueBytes,
                GlobalScript.DEFAULT_TIME_LIMIT.toMillis(), DEFAULT_MAX_RUN_ENTRIES);
    }

    /**
     * Returns the writer of one run.
     *
     * @param connectionId id of the workflow the run executes; for a test run the id of its copy
     * @param executionId  id of the execution, recorded with every value it stores
     */
    public Run forRun(long connectionId, long executionId) {
        long workflowId = testRunOrigins.scopeWorkflowOf(connectionId);
        return new Run(workflowId, workflowId != connectionId, executionId);
    }

    /** Writes the mutable variables of one run. */
    public final class Run {

        private final long workflowId;
        private final boolean testRun;
        private final long executionId;
        // what this run stored and has not logged yet, by variable id; guarded by itself
        private final Map<Long, Written> written = new LinkedHashMap<>();

        private Run(long workflowId, boolean testRun, long executionId) {
            this.workflowId = workflowId;
            this.testRun = testRun;
            this.executionId = executionId;
        }

        /** Tells whether this run only keeps its writes in memory: a test run of a copy. */
        public boolean isTestRun() {
            return testRun;
        }

        /** Returns how long an enhancement of this run that imports a script variable may run. */
        public Duration scriptTimeLimit() {
            return scriptTimeLimit;
        }

        /**
         * Writes a new current value.
         *
         * @param name  name of the variable
         * @param value the value in its JSON type: a string, a number, a boolean, {@code null}, a
         *              list or a map
         * @return the value as it was written, as a JSON tree
         * @throws GlobalVariableNotFoundException if no variable has that name
         * @throws IllegalStateException           if the variable is not mutable, the run's
         *                                         workflow is not its owner, or the value is too
         *                                         large
         */
        public JsonNode write(String name, Object value) {
            GlobalVariable variable = find(name).orElseThrow(() -> new GlobalVariableNotFoundException(name));

            if (variable.getKind() != GlobalVariableKind.MUTABLE) {
                throw new IllegalStateException("Global variable '%s' is a %s and cannot be written by a run"
                        .formatted(name, variable.getKind()));
            }
            if (!Objects.equals(variable.getOwnerWorkflowId(), workflowId)) {
                throw new IllegalStateException(
                        "Only the owner workflow of global variable '%s' writes it, and workflow %d is not its owner"
                                .formatted(name, workflowId));
            }

            JsonNode json = MAPPER.valueToTree(value);
            String text = toText(json);
            if (text.getBytes(StandardCharsets.UTF_8).length > maxValueBytes) {
                throw new IllegalStateException("The value written to global variable '%s' has more than %d bytes"
                        .formatted(name, maxValueBytes));
            }

            if (!testRun) {
                Date writtenAt = new Date();
                repository.writeCurrentValue(variable.getId(), text, writtenAt, executionId);
                noteWrite(variable, text, writtenAt);
            }

            return json;
        }

        /**
         * Logs what this run wrote: one change log entry per variable, with the value before the
         * run's first write, the value of its last write and the number of its writes. After
         * that, the oldest entries of run writes past the limit of the variable are deleted.
         *
         * <p>Called when the run ends, in whatever way: what a run stored stays stored if the run
         * fails later. A test run, and a run that wrote nothing, logs nothing, and a second call
         * logs only what was written since the first. An entry that cannot be saved is skipped
         * with a warning, because the values themselves are already stored and the run must not
         * fail for its log.
         */
        public void logWrites() {
            List<Written> entries;
            synchronized (written) {
                entries = List.copyOf(written.values());
                written.clear();
            }

            for (Written entry : entries) {
                GlobalVariable variable = entry.variable();
                try {
                    changeRepository.save(GlobalVariableChange.writtenByRun(variable, entry.oldValue(),
                            entry.newValue(), workflowId, executionId, entry.count(), entry.lastWrittenAt()));
                    dropOldestRunEntries(variable.getId());
                } catch (RuntimeException e) {
                    log.warn("Execution {}: its {} writes to global variable '{}' could not be logged",
                            executionId, entry.count(), variable.getName(), e);
                }
            }
        }

        // the value read just before the first write is the one the run replaced
        private void noteWrite(GlobalVariable variable, String text, Date writtenAt) {
            Written first = new Written(variable, variable.getCurrentValue(), text, 1, writtenAt);
            synchronized (written) {
                written.merge(variable.getId(), first, (earlier, latest) -> new Written(earlier.variable(),
                        earlier.oldValue(), latest.newValue(), earlier.count() + 1, latest.lastWrittenAt()));
            }
        }

        private void dropOldestRunEntries(long variableId) {
            List<GlobalVariableChange> pastLimit = changeRepository.findByVariableIdAndChangeTypeOrderByIdDesc(
                    variableId, GlobalVariableChange.Type.RUN_WRITE, PageRequest.of(maxRunEntries, 1));
            if (!pastLimit.isEmpty()) {
                changeRepository.deleteByTypeUpTo(variableId, GlobalVariableChange.Type.RUN_WRITE,
                        pastLimit.get(0).getId());
            }
        }

        /**
         * Reads the current value of a mutable variable as the store holds it now. This does not
         * know what a test run wrote, which stays in the run's own copy.
         *
         * @param name name of the variable
         * @return the current value as a JSON tree, or empty if no mutable variable has that name
         *         any more
         * @throws IllegalStateException if the stored value is not valid JSON
         */
        public Optional<JsonNode> readCurrent(String name) {
            return find(name)
                    .filter(variable -> variable.getKind() == GlobalVariableKind.MUTABLE)
                    .map(variable -> parse(name, variable.getCurrentValue()));
        }

        // names are matched exactly, as a reference spells them, whatever the column's collation
        private Optional<GlobalVariable> find(String name) {
            return repository.findByNameIn(List.of(name)).stream()
                    .filter(found -> found.getName().equals(name))
                    .findFirst();
        }

        private JsonNode parse(String name, String text) {
            if (text == null) {
                return NullNode.getInstance();
            }

            try {
                return MAPPER.readTree(text);
            } catch (JsonProcessingException e) {
                // writes only ever store serialized JSON, so the row was changed outside the API
                throw new IllegalStateException(
                        "The current value of global variable '%s' is not valid JSON".formatted(name), e);
            }
        }

        private String toText(JsonNode json) {
            try {
                return MAPPER.writeValueAsString(json);
            } catch (JsonProcessingException e) {
                throw new IllegalStateException("A JSON tree could not be written as text", e);
            }
        }
    }

    /**
     * What one run wrote to one variable so far.
     *
     * @param variable      the variable as it was read before the run's first write
     * @param oldValue      its current value at that moment, as JSON text
     * @param newValue      the value of the run's last write, as JSON text
     * @param count         how many times the run wrote it
     * @param lastWrittenAt when the run wrote it last
     */
    private record Written(GlobalVariable variable, String oldValue, String newValue, int count, Date lastWrittenAt) {
    }

    /**
     * Lets an enhancement in JavaScript write mutable variables with {@code
     * set("{{global.name}}", value)}.
     *
     * <p>A script that calls {@code set} runs wrapped: a prelude defines {@code set}, which records
     * each call in order and returns the value, and the script runs through global {@code eval},
     * so it keeps its own result and its variables. The wrapped script returns both, and the
     * recorded writes are made once the script has finished; a script that fails writes nothing.
     * A script that defines its own {@code set} uses that one.
     */
    public static final class ScriptSets {

        private static final Pattern TARGET = Pattern.compile(RegExpression.globalRef);
        private static final String RESULT = "result";
        private static final String SETS = "sets";

        private ScriptSets() {
        }

        /** One {@code set} call: its target as passed, and its value. */
        public record Write(String target, Object value) {
        }

        /** What a wrapped script returned: its own result, and its writes in order. */
        public record Outcome(Object result, List<Write> writes) {
        }

        /** Returns JavaScript that runs {@code code} and records its {@code set} calls. */
        public static String wrap(String code) {
            String literal;
            try {
                literal = MAPPER.writeValueAsString(code);
            } catch (JsonProcessingException e) {
                throw new IllegalStateException("A script could not be quoted", e);
            }
            // a JSON string may hold these two, a JavaScript string literal may not
            literal = literal.replace("\u2028", "\\u2028").replace("\u2029", "\\u2029");

            return "var OC_SETS = [];\n"
                    + "function set(target, value) { OC_SETS.push({ target: String(target), value: value }); return value; }\n"
                    + "var OC_RESULT = (0, eval)(" + literal + ");\n"
                    + "({ " + RESULT + ": OC_RESULT, " + SETS + ": OC_SETS });";
        }

        /**
         * Reads what a script built by {@link #wrap} returned, after the engine turned it into
         * Java values.
         *
         * @throws IllegalStateException if the result is not the shape {@link #wrap} returns
         */
        public static Outcome unwrap(Object returned) {
            if (!(returned instanceof Map<?, ?> map) || !(map.get(SETS) instanceof List<?> sets)) {
                throw new IllegalStateException("A script that calls set() returned no record of its writes");
            }

            List<Write> writes = new ArrayList<>();
            for (Object set : sets) {
                Map<?, ?> call = (Map<?, ?>) set;
                writes.add(new Write(String.valueOf(call.get("target")), call.get("value")));
            }

            return new Outcome(map.get(RESULT), writes);
        }

        /**
         * Returns the name of the variable a target names: {@code {{global.name}}}, without a
         * path, because a write replaces the whole value. Empty for any other target.
         */
        public static Optional<String> nameOf(String target) {
            Matcher matcher = TARGET.matcher(target == null ? "" : target.strip());
            return matcher.matches() && matcher.group(2) == null
                    ? Optional.of(matcher.group(1))
                    : Optional.empty();
        }
    }
}
