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

import React, {FC, useEffect} from "react";
import {API_REQUEST_STATE, TRIPLET_STATE} from "@application/interfaces/IApplication";
import {IForm} from "@application/interfaces/IForm";
import FormSection from "@app_component/form/form_section/FormSection";
import FormComponent from "@app_component/form/form/Form";
import CurrentSubscription from "@entity/license_management/components/subscriptions/CurrentSubscription";
import {useAppDispatch} from "@application/utils/store";
import Subscription from "@entity/license_management/classes/Subscription";
import {getCurrentSubscription} from "@entity/license_management/redux_toolkit/action_creators/SubscriptionCreators";
import {
    deleteLicense,
    generateActivateRequest
} from "@entity/license_management/redux_toolkit/action_creators/LicenseCreators";
import ImportLicenseComponent from "@entity/license_management/components/import_license/ImportLicenseComponent";
import {ActivationRequestStatus} from "@entity/license_management/requests/models/LicenseModel";
import License from "@entity/license_management/classes/License";
import {Auth} from "@application/classes/Auth";
import ActivateLicenseComponent from "@entity/license_management/components/activate_license/ActivateLicenseComponent";
import Button from "@app_component/base/button/Button";


const LicenseManagement: FC<IForm> = ({}) => {
    const dispatch = useAppDispatch();
    const {authUser} = Auth.getReduxState();
    const {
        currentSubscription, gettingCurrentSubscription
    } = Subscription.getReduxState();
    const {activationRequestStatus, status, activatingLicense} = License.getReduxState();
    useEffect(() => {
        if (activatingLicense === API_REQUEST_STATE.INITIAL || activatingLicense === API_REQUEST_STATE.FINISH) {
            dispatch(getCurrentSubscription());
        }
    }, [activatingLicense])
    const actions = []
    if (!authUser.userDetail.themeSync){
        actions.push(
            <Button
                icon={'file_download'}
                label={'Generate Activation Request'}
                handleClick={() => dispatch(generateActivateRequest())}
            />
        );
        //if (activationRequestStatus === ActivationRequestStatus.PENDING) {
            actions.push(<ImportLicenseComponent/>);
        //}
    } else {
        if (!status && (!currentSubscription || Subscription.isFree(currentSubscription))) {
            actions.push(<ActivateLicenseComponent/>);
        }
    }
    if (currentSubscription && !Subscription.isFree(currentSubscription)) {
        actions.push(
            <Button
                icon={'delete'}
                label={'Delete License'}
                hasConfirmation={true}
                confirmationText={'Do you really want to delete?'}
                handleClick={() => dispatch(deleteLicense(currentSubscription.subId))}
            />);
    }
    const data = {
        title: [{name: 'Admin Panel', link: '/admin_cards'}, {name: 'Subscription Overview'}],
        actions,
        formSections: [
            <FormSection label={{value: 'subscription'}}>
                <div style={{marginLeft: 20}}>
                    {currentSubscription && <CurrentSubscription subscription={currentSubscription}/>}
                </div>
            </FormSection>
        ]
    }
    return(
        <FormComponent {...data} isLoading={gettingCurrentSubscription === API_REQUEST_STATE.START}/>
    )
}

export default LicenseManagement
