import {RootState, useAppSelector} from "@application/utils/store";
import {LicenseListItem} from "@entity/license_management/requests/models/LicenseModel";
import {RoleNames} from "@entity/license_management/components/subscriptions/CurrentSubscription";

export default class License {

    static getReduxState(){
        return useAppSelector((state: RootState) => state.licenseReducer);
    }

    static getOptions(licenses: LicenseListItem[]) {
        return licenses.map(l => {
            return {
                label: RoleNames[l.subscriptionType],
                value: l._id,
            }
        })
    }
}
