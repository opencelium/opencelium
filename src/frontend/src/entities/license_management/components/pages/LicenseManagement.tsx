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
    activateFreeLicense,
    deleteLicense,
    generateActivateRequest, getLicenseStatus
} from "@entity/license_management/redux_toolkit/action_creators/LicenseCreators";
import ImportLicenseComponent from "@entity/license_management/components/import_license/ImportLicenseComponent";
import License from "@entity/license_management/classes/License";
import {Auth} from "@application/classes/Auth";
import ActivateLicenseComponent from "@entity/license_management/components/activate_license/ActivateLicenseComponent";
import Button from "@app_component/base/button/Button";
import {DetailView} from "@entity/license_management/components/detail_view/DetailView";
import ImportCreditsComponent from "@entity/license_management/components/import_credits/ImportCreditsComponent";
import {Application} from "@application/classes/Application";
import {FormProps} from "@app_component/form/form/interfaces";


const LicenseManagement: FC<IForm> = ({}) => {
    const dispatch = useAppDispatch();
    const {authUser} = Auth.getReduxState();
    const {onlineServiceStatus} = Application.getReduxState();
    const {
        currentSubscription, gettingCurrentSubscription, importingCredits,
    } = Subscription.getReduxState();
    const {
        status, activatingLicense,
        deletingLicense, activatingFreeLicense,
        generatingActivateRequest,
    } = License.getReduxState();
    useEffect(() => {
        if (onlineServiceStatus?.active) {
            dispatch(getLicenseStatus());
        }
    }, [onlineServiceStatus?.active])
    useEffect(() => {
        if (importingCredits === API_REQUEST_STATE.FINISH) {
            dispatch(getCurrentSubscription());
        }
    }, [importingCredits])
    useEffect(() => {
        if (activatingLicense === API_REQUEST_STATE.INITIAL || activatingLicense === API_REQUEST_STATE.FINISH) {
            dispatch(getCurrentSubscription());
        }
    }, [activatingLicense])
    useEffect(() => {
        if (deletingLicense === API_REQUEST_STATE.FINISH || activatingFreeLicense === API_REQUEST_STATE.FINISH) {
            dispatch(getCurrentSubscription());
        }
    }, [deletingLicense]);
    useEffect(() => {
        if (activatingFreeLicense === API_REQUEST_STATE.FINISH) {
            dispatch(getCurrentSubscription());
        }
    }, [activatingFreeLicense]);
    const actions = []
    if (!onlineServiceStatus?.active){
        actions.push(
            <Button
                key={'download'}
                id={'license-management-generate-act-req'}
                icon={'file_download'}
                label={'Generate Activation Request'}
                isLoading={generatingActivateRequest === API_REQUEST_STATE.START}
                handleClick={() => dispatch(generateActivateRequest())}
            />
        );
        actions.push(<ImportLicenseComponent key={'upload_license'}/>);
    } else {
        if (onlineServiceStatus?.active && (!currentSubscription || Subscription.isFree(currentSubscription))) {
            actions.push(<ActivateLicenseComponent key={'activate'}/>);
        }
    }
    actions.push(<ImportCreditsComponent key={'upload_credits'}/>);
    if (currentSubscription && !Subscription.isFree(currentSubscription)) {
        actions.push(
            <Button
                key={'delete'}
                icon={'delete'}
                label={'Delete License'}
                hasConfirmation={true}
                isLoading={deletingLicense === API_REQUEST_STATE.START}
                confirmationText={'Do you really want to delete?'}
                handleClick={() => dispatch(deleteLicense(currentSubscription.subId))}
            />);
    }
    if (!currentSubscription) {
        actions.push(
            <Button
                key={'renew_free'}
                icon={'check'}
                label={'Activate Free License'}
                isLoading={activatingFreeLicense === API_REQUEST_STATE.START}
                handleClick={() => dispatch(activateFreeLicense())}
            />);
    }
    const data: FormProps = {
        entityKey: 'license-management-offline',
        title: [{name: 'Admin Panel', link: '/admin_cards'}, {name: 'Subscription Overview'}],
        actions,
        formSections: [
            <FormSection label={{value: 'subscription'}} id={'license-management-subscription'}>
                <div style={{marginLeft: 20}}>
                    <CurrentSubscription subscription={currentSubscription || Subscription.getEmptySubscription()}/>
                </div>
            </FormSection>,
            <FormSection label={{value: 'Detail View'}} id={'license-management-detail-view'} dependencies={[!currentSubscription]}>
                <DetailView/>
            </FormSection>
        ]
    }
    return(
        <FormComponent {...data} hasNotAlert={true} isLoading={gettingCurrentSubscription === API_REQUEST_STATE.START}/>
    )
}

export default LicenseManagement
