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
import {fetchUsers} from "@actions/users/fetch";
import {SingleComponent} from "@decorators/SingleComponent";


function mapStateToProps(state){
    const auth = state.get('auth');
    const users = state.get('users');
    const updateAssistant = state.get('update_assistant');
    return{
        authUser: auth.get('authUser'),
        updatingSubscription: updateAssistant.get('updatingSubscription'),
        fetchingUsers: users.get('fetchingUsers'),
        users: users.get('users').toJS(),
    };
}

/**
 * Layout for UpdateSubscription
 */
@connect(mapStateToProps, {updateSubscription, fetchUsers, logoutUserFulfilled})
@permission(UpdateSubscriptionPermissions.CREATE, true)
@withTranslation(['update_subscription', 'app'])
@SingleComponent('', '', ['users'])
class UpdateSubscription extends Component{

    constructor(props){
        super(props);
        const {authUser} = this.props;
        this.state = {
            currentTour: 'page_1',
            isTourOpen: automaticallyShowTour(authUser),
            entity:{
                user: null,
            },
            validationMessageUser: '',
        };
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

    updateSubscription(entity){
        if(this.validateUser(entity)){
            this.props.updateSubscription();
        }
    }

    mapUsers(){
        const {users} = this.props;
        let result = [];
        users && users.map(user => {
            if(user.bitbucketUser){
                result.push({label: user.email, value: user.id});
            }
        });
        return result;
    }

    /**
     * to validate user
     */
    validateUser(entity){
        const {t} = this.props;
        if(entity.user === null){
            this.setState({validationMessageUser: t(`FORM.VALIDATION_MESSAGES.USER_REQUIRED`)});
            return false;
        }
        return true;
    }

    render(){
        const {entity, validationMessageUser} = this.state;
        const {t, updatingSubscription} = this.props;
        let contentTranslations = {};
        contentTranslations.header = {title: t('FORM.HEADER')};
        contentTranslations.action_button = {title: `${t('FORM.UPDATE_SUBSCRIPTION')}`, isDisabled: entity.user === null};
        let contents = [{
            inputs: [
                {
                    ...INPUTS.SUBSCRIPTION_USER,
                    source: this.mapUsers(),
                    label: t('FORM.USER'),
                    error: validationMessageUser,
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
                isActionInProcess={updatingSubscription}
                action={::this.updateSubscription}
                entity={entity}
                type={'onlyText'}
            />
        );
    }
}

export default UpdateSubscription;