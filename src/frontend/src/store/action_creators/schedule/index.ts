import NotificationCreators from "@action/schedule/NotificationCreators";
import NotificationTemplateCreators from "@action/schedule/NotificationTemplateCreators";
import ScheduleCreators from "@action/schedule/ScheduleCreators";
import WebhookCreators from "@action/schedule/WebhookCreators";

export default {
    ...NotificationCreators,
    ...NotificationTemplateCreators,
    ...ScheduleCreators,
    ...WebhookCreators,
}