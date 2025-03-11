/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import ActionCreators from "../../redux_toolkit/action_creators";
import {importCredits} from "@entity/license_management/redux_toolkit/action_creators/SubscriptionCreators";

const {
    getLicenseStatus, activateLicenseString, activateLicenseFile,
    getLicenseList
} = ActionCreators;


export default {
    fulfilled: {
        [activateLicenseString.fulfilled.type]: "The license text was successfully activated.",
        [activateLicenseFile.fulfilled.type]: "The license file was successfully activated.",
        [importCredits.fulfilled.type]: "The credits were successfully uploaded.",
    },
    rejected: {
        [importCredits.rejected.type]: {
            "EXTRA_OPS_ALREADY_EXISTS": "These credits are already used.",
            "SUBSCRIPTION_NOT_FOUND": "Subscription not found for this license.",
            "__DEFAULT__": "The credits file is corrupted. Please, contact with support."
        },
        [activateLicenseFile.rejected.type]: {
            "__DEFAULT__": "There is an error activating license file."
        },
        [activateLicenseString.rejected.type]: {
            "__DEFAULT__": "There is an error activating license text."
        },
        [getLicenseList.rejected.type]: {
            "__DEFAULT__": "There is an error fetching licenses."
        },
        [getLicenseStatus.rejected.type]: {
            "__NATIVE__": "-"
        }
    },
}
