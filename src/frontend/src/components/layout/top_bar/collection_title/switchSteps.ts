import {DashboardTourSteps} from "@entity/dashboard/utils/tourSteps";
import {ProfileTourSteps} from "@entity/profile/utils/tourSteps";
import {EntityIconKeyType} from "@application/interfaces/IApplication";
import {
    AddConnectorTourSteps, ConnectorListSteps, EmptyConnectorListSteps,
    UpdateConnectorWithMaskTourSteps, UpdateConnectorWithoutMaskTourSteps
} from "@entity/connector/utils/tourSteps";
import {
    ConnectionFormWithoutPanel,
    ConnectionFormWithPanel,
    ConnectionListSteps,
    EmptyConnectionListSteps,
} from "@root/utils/tourSteps";
import {EmptyScheduleListSteps, ScheduleFormSteps, ScheduleListSteps} from "@entity/schedule/utils/tourSteps";
import {AdminCardListSteps} from "@entity/admin_card/utils/tourSteps";
import {UserEmptyListSteps, UserFormTourSteps, UserListSteps} from "@entity/user/utils/tourSteps";
import {
    UserGroupEmptyListSteps,
    UserGroupFormWithoutPermissionTourSteps, UserGroupFormWithPermissionTourSteps,
    UserGroupListSteps
} from "@entity/user_group/utils/tourSteps";
import {LDAPWithDebugTourSteps, LDAPWithoutDebugTourSteps} from "@entity/ldap/utils/tourSteps";
import {SupportFileEmptyListSteps, SupportFileListSteps} from "@entity/support_files/utils/tourSteps";
import {CategoryEmptyListSteps, CategoryFormSteps, CategoryListSteps} from "@entity/category/utils/tourSteps";
import {ExternalApplicationListSteps} from "@entity/external_application/utils/tourSteps";
import {
    NotificationTemplateEmptyListSteps, NotificationTemplateFormSteps,
    NotificationTemplateListSteps
} from "@entity/notification_template/utils/tourSteps";
import {ConnectionTemplateEmptyListSteps, ConnectionTemplateListSteps} from "@entity/template/utils/tourSteps";
import {
    AggregatorEmptyListSteps,
    AggregatorFormTourSteps,
    AggregatorListSteps
} from "@entity/data_aggregator/utils/tourSteps";
import {LicenseManagementSteps} from "@entity/license_management/utils/tourSteps";
import {InvokerEmptyListSteps, InvokerFormTours, InvokerListSteps} from "@entity/invoker/utils/tourSteps";
import {UpdateAssistantSteps} from "@entity/update_assistant/utils/tourSteps";

export function switchSteps(entityIconKey: EntityIconKeyType) {

    switch (entityIconKey) {
        case 'dashboard':
             return DashboardTourSteps
        case 'profile-form':
            return ProfileTourSteps
        case 'add-connector-form-with-credentials':
            return AddConnectorTourSteps;
        case 'add-connector-form-without-credentials':
            return [AddConnectorTourSteps[0]];
        case 'update-connector-form-with-mask':
            return UpdateConnectorWithMaskTourSteps;
        case 'update-connector-form-without-mask':
            return UpdateConnectorWithoutMaskTourSteps;
        case 'connector-list-empty':
            return EmptyConnectorListSteps;
        case 'connector-list':
            return ConnectorListSteps;
        case 'connection-list-empty':
            return EmptyConnectionListSteps;
        case 'connection-list':
            return ConnectionListSteps;
        case 'schedule-list-empty':
            return EmptyScheduleListSteps;
        case 'schedule-list':
            return ScheduleListSteps;
        case 'schedule-form':
            return ScheduleFormSteps;
        case 'connection-form-with-panel':
            return ConnectionFormWithPanel;
        case 'connection-form-without-panel':
            return ConnectionFormWithoutPanel;
        case 'admin-card-list':
        case 'admin-card-list-empty':
            return AdminCardListSteps;
        case 'user-list':
            return UserListSteps;
        case 'user-list-empty':
            return UserEmptyListSteps;
        case 'user-form':
            return UserFormTourSteps;
        case 'group-list':
            return UserGroupListSteps;
        case 'group-list-empty':
            return UserGroupEmptyListSteps;
        case 'group-form-without-permission':
            return UserGroupFormWithoutPermissionTourSteps;
        case 'group-form-with-permission':
            return UserGroupFormWithPermissionTourSteps;
        case 'ldap-form-with-debug':
            return LDAPWithDebugTourSteps;
        case 'ldap-form-without-debug':
            return LDAPWithoutDebugTourSteps;
        case 'support-file-list':
            return SupportFileListSteps;
        case 'support-file-list-empty':
            return SupportFileEmptyListSteps;
        case 'category-list':
            return CategoryListSteps;
        case 'category-list-empty':
            return CategoryEmptyListSteps;
        case 'category-form':
            return CategoryFormSteps;
        case 'external-application-list':
            return ExternalApplicationListSteps;
        case 'notification-template-list':
            return NotificationTemplateListSteps;
        case 'notification-template-list-empty':
            return NotificationTemplateEmptyListSteps;
        case 'notification-template-form':
            return NotificationTemplateFormSteps;
        case 'license-management':
            return LicenseManagementSteps;
        case 'template-list':
            return ConnectionTemplateListSteps;
        case 'template-list-empty':
            return ConnectionTemplateEmptyListSteps;
        case 'aggregator-list':
            return AggregatorListSteps;
        case 'aggregator-list-empty':
            return AggregatorEmptyListSteps;
        case 'aggregator-form':
            return AggregatorFormTourSteps;
        case 'invoker-list-empty':
            return InvokerEmptyListSteps;
        case 'invoker-list':
            return InvokerListSteps;
        case 'invoker-form':
            return InvokerFormTours;
        case 'update-assistant':
            return UpdateAssistantSteps;
        default:
            return [];
    }
}
