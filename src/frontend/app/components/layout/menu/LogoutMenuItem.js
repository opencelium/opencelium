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

import React, { Component }  from 'react';
import {withRouter, Link} from 'react-router';
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";

import {
    addLogoutKeyNavigation, removeLogoutKeyNavigation,
} from "@utils/key_navigation";
import {permission} from "@decorators/permission";
import {ConnectorPermissions} from "@utils/constants/permissions";
import {MenuLink} from "@components/layout/menu/MenuLink";
import CVoiceControl from "@classes/voice_control/CVoiceControl";
import Confirmation from "@components/general/app/Confirmation";
import {history} from "@components/App";
import {logoutUserFulfilled} from "@actions/auth";


function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}

/**
 * Menu Connectors
 */
@connect(mapStateToProps, {logoutUserFulfilled})
@permission(ConnectorPermissions.READ)
@withTranslation('layout')
class LogoutMenuItem extends Component{

    constructor(props){
        super(props);
        this.state = {
            showConfirm: false,
        };

        this.isConfirmationToggledMainMenu = false;
    }

    componentDidMount(){
        addLogoutKeyNavigation(this);
    }

    componentWillUnmount(){
        removeLogoutKeyNavigation(this);
    }

    /**
     * to toggle confirmation dialog
     */
    toggleConfirm(){
        const {isMainMenuExpanded, onToggleMainMenu} = this.props;
        this.setState({showConfirm: !this.state.showConfirm});
        if(isMainMenuExpanded || this.isConfirmationToggledMainMenu && this.state.showConfirm){
            onToggleMainMenu();
            this.isConfirmationToggledMainMenu = true;
        }
        if(!this.state.showConfirm && !isMainMenuExpanded){
            this.isConfirmationToggledMainMenu = false;
        }
    }

    /**
     * to show confirmation dialog before logout
     */
    wantLogout(){
        this.toggleConfirm();
    }

    /**
     * to logout from app
     */
    doLogout(){
        const {logoutUserFulfilled} = this.props;
        logoutUserFulfilled({});
        history.push('/login');
        CVoiceControl.removeAll();
    }

    render(){
        const {t} = this.props;
        return[
            <MenuLink
                key={'log_out'}
                onClick={::this.wantLogout}
                value={'logout'}
                label={'Log Out'}
                size={24}
            />,
            <Confirmation
                key={'confirmation'}
                okClick={::this.doLogout}
                cancelClick={::this.toggleConfirm}
                active={this.state.showConfirm}
                title={t('HEADER.LOGOUT.CONFIRMATION_TITLE')}
                message={t('HEADER.LOGOUT.CONFIRMATION_MESSAGE')}
            />
        ];
    }
}

export default withRouter(LogoutMenuItem);