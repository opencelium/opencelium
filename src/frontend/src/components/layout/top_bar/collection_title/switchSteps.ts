import {DashboardTourSteps} from "@entity/dashboard/utils/tourSteps";
import {ProfileTourSteps} from "@entity/profile/utils/tourSteps";
import {EntityIconKeyType} from "@application/interfaces/IApplication";
import {
    AddConnectorTourSteps, ConnectorListSteps, EmptyConnectorListSteps,
    UpdateConnectorTourSteps,
    UpdateConnectorWithMaskTourSteps, UpdateConnectorWithoutMaskTourSteps
} from "@entity/connector/utils/tourSteps";
import {ConnectionListSteps, EmptyConnectionListSteps} from "@root/utils/tourSteps";
import {EmptyScheduleListSteps, ScheduleListSteps} from "@entity/schedule/utils/tourSteps";

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
        default:
            return [];
    }
}
