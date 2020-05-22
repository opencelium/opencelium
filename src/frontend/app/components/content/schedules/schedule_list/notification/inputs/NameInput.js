/*
 * Copyright (C) <2020>  <becon GmbH>
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
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {withTranslation} from "react-i18next";
import Input from "../../../../../general/basic_components/inputs/Input";
import CNotification from "../../../../../../classes/components/content/schedule/notification/CNotification";


function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}

/**
 * Name Input for Notification Change Component
 */
@connect(mapStateToProps, {})
@withTranslation('schedules')
class NameInput extends Component{

    constructor(props){
        super(props);
    }

    /**
     * to change name
     */
    onChangeInput(name){
        let {notification} = this.props;
        const {changeNotification} = this.props;
        notification.name = name;
        changeNotification(notification);
    }

    render(){
        const {t, notification} = this.props;
        return (
            <Input
                onChange={::this.onChangeInput}
                name={'input_notification_name'}
                id={'input_notification_name'}
                label={t('NOTIFICATION.NOTIFICATION_CHANGE.NAME_LABEL')}
                type={'text'}
                icon={'perm_identity'}
                maxLength={256}
                value={notification.name}
            />
        );
    }
}

NameInput.propTypes = {
    notification: PropTypes.instanceOf(CNotification).isRequired,
    changeNotification: PropTypes.func.isRequired,
};

export default NameInput;