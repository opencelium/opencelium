import ActionCreators from "../../redux_toolkit/action_creators";

const {
    addNotificationTemplate, updateNotificationTemplate, deleteNotificationTemplateById,
    deleteNotificationTemplatesById, getNotificationTemplateById, getNotificationTemplatesByType, checkNotificationTemplateName, getAllNotificationTemplates
} = ActionCreators;

export default {
    fulfilled: {
        [addNotificationTemplate.fulfilled.type]: "The notification <1><0>{{name}}</0></1> was successfully added",
        [updateNotificationTemplate.fulfilled.type]: "The notification <1><0>{{name}}</0></1> was successfully updated",
        [deleteNotificationTemplateById.fulfilled.type]: "The notification <1><0>{{name}}</0></1> was successfully removed",
        [deleteNotificationTemplatesById.fulfilled.type]: "The selected templates were successfully removed",
    },
    rejected: {
        [getNotificationTemplateById.rejected.type]: {
            "__DEFAULT__": "There is an error fetching notification template."
        },
        [getAllNotificationTemplates.rejected.type]: {
            "__DEFAULT__": "There is an error fetching notification templates."
        },
        [addNotificationTemplate.rejected.type]: {
            "__DEFAULT__": "The notification was not added"
        },
        [updateNotificationTemplate.rejected.type]: {
            "__DEFAULT__": "The notification was not updated"
        },
        [deleteNotificationTemplateById.rejected.type]: {
            "__DEFAULT__": "The notification was not removed"
        },
        [deleteNotificationTemplatesById.rejected.type]: {
            "__DEFAULT__": "The selected templates were not removed"
        },
    },
}