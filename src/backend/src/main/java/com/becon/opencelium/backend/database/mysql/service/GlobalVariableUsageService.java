package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mysql.entity.EventMessage;
import com.becon.opencelium.backend.database.mysql.entity.EventNotification;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableUsage;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Keeps track of where global variables are used and guards the workflows, connectors and
 * notifications that use them.
 *
 * <p>The usages of a source are derived from its content: they are written anew on every save
 * and removed when the source is deleted.
 */
public interface GlobalVariableUsageService {

    /**
     * Checks the global variable references of a workflow that is about to be saved: the
     * variable exists, the workflow is in its scope and the saving user may use it.
     *
     * @param connectionMng the workflow as it will be saved
     * @param connectionId  id of the workflow, or {@code null} if it is saved for the first time
     * @param categoryId    category the workflow will be in, or {@code null} for none
     * @throws com.becon.opencelium.backend.exception.GlobalReferenceValidationException if a
     *         reference cannot be used in this workflow
     */
    void checkWorkflow(ConnectionMng connectionMng, Long connectionId, Integer categoryId);

    /**
     * Replaces the usages of a workflow with the references its content holds now. A reference
     * to a variable that does not exist leaves no usage.
     *
     * @param connectionMng the saved content of the workflow; {@code null} clears its usages
     */
    void rebuildForWorkflow(long connectionId, ConnectionMng connectionMng);

    /** Removes the usages of a workflow that is being deleted. */
    void deleteForWorkflow(long connectionId);

    /**
     * Checks the global variable references in the request data of a connector that is about to
     * be saved: the variable exists, it is open to all workflows and the saving user may use it.
     *
     * @param requestData the values by the name of their field, as the user wrote them, that is
     *                    before they are encrypted
     * @throws com.becon.opencelium.backend.exception.GlobalReferenceValidationException if a
     *         reference cannot be used in a connector
     */
    void checkConnector(Map<String, String> requestData);

    /**
     * Replaces the usages of a connector with the references its request data holds now.
     *
     * @param requestData every value of the connector by the name of its field, not encrypted
     */
    void rebuildForConnector(long connectorId, Map<String, String> requestData);

    /**
     * Replaces the usages of some request data fields of a connector. The usages of the fields
     * that are not given stay as they are.
     *
     * @param requestData the new values by the name of their field, not encrypted
     */
    void rebuildForConnectorFields(long connectorId, Map<String, String> requestData);

    /** Removes the usages of a connector that is being deleted. */
    void deleteForConnector(long connectorId);

    /**
     * Checks the global variable references a notification that is about to be saved would
     * send, which are the ones in the texts of its template: the variable exists, the workflow
     * of the notification's schedule is in its scope and the saving user may use it.
     *
     * @throws com.becon.opencelium.backend.exception.GlobalReferenceValidationException if a
     *         reference cannot be used in this notification
     */
    void checkNotification(EventNotification notification);

    /** Replaces the usages of a saved notification with the references its template holds now. */
    void rebuildForNotification(EventNotification notification);

    /** Removes the usages of a notification that is being deleted. */
    void deleteForNotification(long notificationId);

    /**
     * Checks the global variable references of a notification template that is about to be
     * saved: the variable exists, the saving user may use it, and the workflow of every
     * notification that sends this template is in its scope.
     *
     * @param template the template as it will be saved, with its texts
     * @throws com.becon.opencelium.backend.exception.GlobalReferenceValidationException if a
     *         reference cannot be used in this template
     */
    void checkTemplate(EventMessage template);

    /**
     * Replaces the usages of every notification that sends a template with the references the
     * template holds now.
     *
     * @param template the saved template, with its texts
     */
    void rebuildForTemplate(EventMessage template);

    /** Removes the usages of the notifications that are deleted together with their template. */
    void deleteForTemplate(int templateId);

    /**
     * Returns the workflow a notification belongs to, which is the one its schedule runs. The
     * scope of a variable the notification uses must keep that workflow in.
     *
     * @return the id of the workflow, or empty if the notification no longer exists
     */
    Optional<Long> workflowOfNotification(long notificationId);

    /**
     * Returns the usages of a variable. Usages of workflows, connectors and notifications that
     * no longer exist are removed first, so what is returned really stands in the way of
     * deleting the variable.
     */
    List<GlobalVariableUsage> findByVariable(long variableId);

    /**
     * Counts the usages of several variables.
     *
     * @return the number of usages by variable id; a variable that is not used is left out
     */
    Map<Long, Long> countByVariables(Collection<Long> variableIds);
}
