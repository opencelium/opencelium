/*
 * Copyright (C) <2021>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {Component} from 'react';
import {connect} from 'react-redux';
import {withTranslation} from "react-i18next";
import {UpdateSubscriptionPermissions} from "@utils/constants/permissions";
import {automaticallyShowTour} from "@utils/constants/tours";
import {INPUTS} from "@utils/constants/inputs";
import {permission} from "@decorators/permission";

import {API_REQUEST_STATE} from "@utils/constants/app";
import CVoiceControl from "@classes/voice_control/CVoiceControl";
import Form from "@change_component/Form";
import {logoutUserFulfilled, updateSubscription} from "@actions/auth";
import FileNames from "@components/content/update_subscription/FileNames";
import {doSubscriptionUpdate} from "@actions/subscription_update/fetch";


function mapStateToProps(state){
    const auth = state.get('auth');
    const updateSubscription = state.get('subscription_update');
    return{
        authUser: auth.get('authUser'),
        doingSubscriptionUpdate: updateSubscription.get('doingSubscriptionUpdate'),
        fileNames: updateSubscription.get('fileNames').toJS(),
    };
}

/**
 * Layout for UpdateSubscription
 */
@connect(mapStateToProps, {doSubscriptionUpdate, logoutUserFulfilled})
@permission(UpdateSubscriptionPermissions.CREATE, true)
@withTranslation(['update_subscription', 'app'])
class UpdateSubscription extends Component{

    constructor(props){
        super(props);
        this.isUpdateStarted = false;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(this.props.updatingSubscription === API_REQUEST_STATE.FINISH){
            this.isUpdateStarted = false;
            const {logoutUserFulfilled} = this.props;
            logoutUserFulfilled({});
            this.props.router.push(`/login`);
            CVoiceControl.removeAll();
        }
    }

    updateSubscription(){
        this.props.doSubscriptionUpdate();
    }

    render(){
        const {t, doingSubscriptionUpdate, fileNames} = this.props;
        let contentTranslations = {};
        contentTranslations.header = {title: t('FORM.HEADER')};
        contentTranslations.action_button = {title: `${t('FORM.UPDATE_SUBSCRIPTION')}`, isDisabled: fileNames.length === 0};
        let contents = [{
            inputs: [
                {
                    ...INPUTS.SUBSCRIPTION_USER,
                    readonly: true,
                    Component: FileNames,
                    label: t('FORM.FILE_NAMES'),
                },
            ],
            hint: {text: t('FORM.HINT_1')},
            header: t(`FORM.PAGE_1`),
            hasHint: true,
        }];
        return (
            <Form
                contents={contents}
                translations={contentTranslations}
                isActionInProcess={doingSubscriptionUpdate === API_REQUEST_STATE.START}
                action={::this.updateSubscription}
                type={'onlyText'}
            />
        );
    }
}

export default UpdateSubscription;