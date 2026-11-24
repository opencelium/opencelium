package com.becon.opencelium.backend.resource.globalvariable;

import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableUsage;

/**
 * One place where a global variable is used.
 *
 * @param sourceType   what holds the reference
 * @param sourceId     id of the workflow, connector or notification
 * @param sourceTitle  its title, for a notification its name; {@code null} if it no longer
 *                     exists
 * @param elementType  kind of the workflow element that holds the reference; {@code null} for a
 *                     connector and a notification, which have no elements
 * @param elementLabel what the editor calls the element; for a notification the name of the
 *                     template that holds the reference
 * @param color        color of the element if it is a method; with {@code index} it lets the
 *                     editor open the workflow on that element
 * @param index        index path of the element, {@code null} outside a workflow
 * @param field        where the reference stands: in a workflow element e.g. {@code
 *                     body.filter.since}, in a connector the name of the request data field, in
 *                     a notification the text of the template, e.g. {@code en.body}
 * @param access       what the element does with the variable
 */
public record GlobalVariableUsageDTO(
        GlobalVariableUsage.SourceType sourceType,
        Long sourceId,
        String sourceTitle,
        GlobalVariableUsage.ElementType elementType,
        String elementLabel,
        String color,
        String index,
        String field,
        GlobalVariableUsage.Access access) {
}
