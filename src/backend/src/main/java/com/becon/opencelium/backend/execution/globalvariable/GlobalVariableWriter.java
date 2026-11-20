package com.becon.opencelium.backend.execution.globalvariable;

import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.database.mysql.repository.GlobalVariableRepository;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableKind;
import com.becon.opencelium.backend.exception.GlobalVariableNotFoundException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.Objects;

/**
 * Writes mutable global variables for running executions.
 *
 * <p>Only a run of a variable's owner workflow may write it. A write replaces the whole current
 * value in one statement and records when and by which execution it was written. A test run, which
 * runs a copy of the workflow, is checked as its origin but stores nothing: its writes reach only
 * the run's own copy of the values, so testing never moves a value a production run relies on.
 */
@Component
public class GlobalVariableWriter {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final GlobalVariableRepository repository;
    private final TestRunOrigins testRunOrigins;
    private final int maxValueBytes;

    public GlobalVariableWriter(GlobalVariableRepository repository, TestRunOrigins testRunOrigins,
            @Value("${opencelium.global-variable.max-value-bytes:65536}") int maxValueBytes) {
        this.repository = repository;
        this.testRunOrigins = testRunOrigins;
        this.maxValueBytes = maxValueBytes;
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

        private Run(long workflowId, boolean testRun, long executionId) {
            this.workflowId = workflowId;
            this.testRun = testRun;
            this.executionId = executionId;
        }

        /** Tells whether this run only keeps its writes in memory: a test run of a copy. */
        public boolean isTestRun() {
            return testRun;
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
            GlobalVariable variable = repository.findByNameIn(List.of(name)).stream()
                    .filter(found -> found.getName().equals(name))
                    .findFirst()
                    .orElseThrow(() -> new GlobalVariableNotFoundException(name));

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
                repository.writeCurrentValue(variable.getId(), text, new Date(), executionId);
            }

            return json;
        }

        private String toText(JsonNode json) {
            try {
                return MAPPER.writeValueAsString(json);
            } catch (JsonProcessingException e) {
                throw new IllegalStateException("A JSON tree could not be written as text", e);
            }
        }
    }
}
