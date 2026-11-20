package com.becon.opencelium.backend.database.mysql.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.Objects;

/**
 * One place where a {@link GlobalVariable} is used: a reference found in an element of a
 * workflow, a connector or a notification.
 *
 * <p>The rows of a source are rebuilt whenever the source is saved. They answer "used by" and
 * are what stops a variable from being deleted, renamed or scoped away from a source that uses
 * it.
 */
@Entity
@Table(name = "global_variable_usage")
public class GlobalVariableUsage {

    /** What holds the reference. */
    public enum SourceType {
        WORKFLOW, CONNECTOR, NOTIFICATION, SCRIPT_VARIABLE
    }

    /** The element of a workflow that holds the reference; a connector and a notification have none. */
    public enum ElementType {
        METHOD, OPERATOR, ENHANCEMENT, AGGREGATOR, SET_STEP
    }

    /** What the element does with the variable. */
    public enum Access {
        READ, WRITE, CALL, IMPORT, REF
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "variable_id", nullable = false, updatable = false)
    private Long variableId;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", length = 16, nullable = false, updatable = false)
    private SourceType sourceType;

    @Column(name = "source_id", nullable = false, updatable = false)
    private Long sourceId;

    @Enumerated(EnumType.STRING)
    @Column(name = "element_type", length = 16, updatable = false)
    private ElementType elementType;

    // index path of the element inside a workflow, e.g. 0_1
    @Column(name = "element_ref", updatable = false)
    private String elementRef;

    @Column(name = "element_color", length = 16, updatable = false)
    private String elementColor;

    // what the editor calls the element; for a notification the name of its template
    @Column(name = "element_label", updatable = false)
    private String elementLabel;

    @Column(name = "field", length = 512, updatable = false)
    private String field;

    @Enumerated(EnumType.STRING)
    @Column(name = "access", length = 16, nullable = false, updatable = false)
    private Access access;

    protected GlobalVariableUsage() {
    }

    /**
     * Creates the usage of a variable an element of a workflow reads.
     *
     * @param variableId   id of the variable
     * @param connectionId id of the workflow
     * @param elementType  kind of the element
     * @param index        index path of the element
     * @param color        color of the element if it is a method, otherwise {@code null}
     * @param label        what the editor calls the element
     * @param field        where in the element the reference stands, e.g. {@code body.filter.since}
     */
    public static GlobalVariableUsage readByWorkflow(long variableId, long connectionId, ElementType elementType,
            String index, String color, String label, String field) {
        GlobalVariableUsage usage = new GlobalVariableUsage();
        usage.variableId = variableId;
        usage.sourceType = SourceType.WORKFLOW;
        usage.sourceId = connectionId;
        usage.elementType = Objects.requireNonNull(elementType, "elementType");
        usage.elementRef = index;
        usage.elementColor = color;
        usage.elementLabel = label;
        usage.field = field;
        usage.access = Access.READ;

        return usage;
    }

    /**
     * Creates the usage of a variable an element of a workflow writes: a target of a method's
     * {@code globalWrites}. Takes the same arguments as {@link #readByWorkflow}.
     */
    public static GlobalVariableUsage writeByWorkflow(long variableId, long connectionId, ElementType elementType,
            String index, String color, String label, String field) {
        GlobalVariableUsage usage =
                readByWorkflow(variableId, connectionId, elementType, index, color, label, field);
        usage.access = Access.WRITE;

        return usage;
    }

    /**
     * Creates the usage of a variable the request data of a connector reads.
     *
     * @param variableId  id of the variable
     * @param connectorId id of the connector
     * @param field       name of the request data field that holds the reference
     */
    public static GlobalVariableUsage readByConnector(long variableId, long connectorId, String field) {
        return readOutsideWorkflow(variableId, SourceType.CONNECTOR, connectorId, null, field);
    }

    /**
     * Creates the usage of a variable a notification reads through the texts of its template.
     *
     * @param variableId     id of the variable
     * @param notificationId id of the notification
     * @param template       name of the template that holds the reference
     * @param field          the text of the template that holds it, e.g. {@code en.body}
     */
    public static GlobalVariableUsage readByNotification(long variableId, long notificationId, String template,
            String field) {
        return readOutsideWorkflow(variableId, SourceType.NOTIFICATION, notificationId, template, field);
    }

    // a connector and a notification have no elements: the field alone says where the reference is
    private static GlobalVariableUsage readOutsideWorkflow(long variableId, SourceType sourceType, long sourceId,
            String label, String field) {
        GlobalVariableUsage usage = new GlobalVariableUsage();
        usage.variableId = variableId;
        usage.sourceType = sourceType;
        usage.sourceId = sourceId;
        usage.elementLabel = label;
        usage.field = field;
        usage.access = Access.READ;

        return usage;
    }

    public Long getId() {
        return id;
    }

    public Long getVariableId() {
        return variableId;
    }

    public SourceType getSourceType() {
        return sourceType;
    }

    public Long getSourceId() {
        return sourceId;
    }

    public ElementType getElementType() {
        return elementType;
    }

    public String getElementRef() {
        return elementRef;
    }

    public String getElementColor() {
        return elementColor;
    }

    public String getElementLabel() {
        return elementLabel;
    }

    public String getField() {
        return field;
    }

    public Access getAccess() {
        return access;
    }
}
