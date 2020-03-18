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

import React, { Component }  from 'react';
import {connect} from 'react-redux';
import {withTranslation} from "react-i18next";
import {history} from '../../../components/App';

import ListItemLink from "../../general/basic_components/ListItemLink";
import Confirmation from "../../general/app/Confirmation";
import {logoutUserFulfilled} from '../../../actions/auth';
import {
    addLogoutKeyNavigation, removeLogoutKeyNavigation,
} from '../../../utils/key_navigation';
import styles from '../../../themes/default/layout/header.scss';


function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
        isAuth: auth.get('isAuth'),
    };
}

/**
 * Menu Logout Icon
 */
@connect(mapStateToProps, {logoutUserFulfilled})
@withTranslation('layout')
class LogoutMenuItem extends Component{

    constructor(props){
        super(props);
        this.state = {
            showConfirm: false,
        };
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
        this.setState({showConfirm: !this.state.showConfirm});
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
    }

    render(){
        const {t} = this.props;
        return [
            <ListItemLink
                label={{text: '', index: 4}}
                onClick={::this.wantLogout}
                tooltip={t('HEADER.LOGOUT.TITLE')}
                icon='exit_to_app'
                style={{paddingRight: '30px', height: '40px', paddingTop: '8px'}}
                className={`tour-step-logout`}
                itemClassName={styles.logout_header}
                key={1}
            />,
            <Confirmation
                okClick={::this.doLogout}
                cancelClick={::this.toggleConfirm}
                active={this.state.showConfirm}
                title={t('HEADER.LOGOUT.CONFIRMATION_TITLE')}
                message={t('HEADER.LOGOUT.CONFIRMATION_MESSAGE')}
                key={2}
            />
        ];
    }
}

export default LogoutMenuItem;