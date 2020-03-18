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

import React, { Component, Suspense }  from 'react';
import {connect} from 'react-redux';
import {withTranslation} from "react-i18next";

import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import LoadingHeader from './LoadingHeader';
import LogoutMenuItem from './LogoutMenuItem';
import {Roles} from '../../../utils/constants/app';
import UsersMenuItem from "./UsersMenuItem";
import UserGroupsMenuItem from "./UserGroupsMenuItem";
import ConnectorsMenuItem from "./ConnectorsMenuItem";
import ConnectionsMenuItem from "./ConnectionsMenuItem";
import MyProfileMenuItem from "./MyProfileMenuItem";
import SchedulesMenuItem from "./SchedulesMenuItem";

import AdminCardsMenuItem from "./AdminCardsMenuItem";
import TooltipFontIcon from "../../general/basic_components/tooltips/TooltipFontIcon";
import {getThemeClass} from "../../../utils/app";
import styles from '../../../themes/default/layout/header.scss';
import LogoMenuItem from "./LogoMenuItem";


function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        isAuth: auth.get('isAuth'),
        authUser: auth.get('authUser'),
        role: auth.get('authUser') ? auth.get('authUser').role : Roles.GUEST,
        logining: auth.get('logining'),
        logouting: auth.get('logouting'),
    };
}

/**
 * Header Component
 */
@connect(mapStateToProps, {})
@withTranslation('layout')
class Header extends Component{

    constructor(props){
        super(props);

        this.state = {
            expanded: false,
            currentPath: props.router.getCurrentLocation().pathname,
        };
    }

    componentDidUpdate(){
        let pathName = this.props.router.getCurrentLocation().pathname;
        if(this.state.currentPath !== pathName) {
            this.setState({
                currentPath: pathName,
                expanded: false,
            });
        }
    }

    /**
     * to toggle menu
     *
     * @param expanded - expand and undo
     */
    onToggleHeader(expanded){
        this.setState({
            expanded,
        });
    }

    render(){
        const {expanded} = this.state;
        const {authUser, t} = this.props;
        let classNames = ['header'];
        if(authUser) {
            classNames = getThemeClass({classNames, authUser, styles});
        }
        return (
            <Navbar
                className={styles[classNames.header]}
                expand={"lg"}
                expanded={expanded}
                onToggle={::this.onToggleHeader}>
                <Navbar.Brand>
                    <LogoMenuItem/>
                </Navbar.Brand>
                <Suspense fallback={(<LoadingHeader/>)}>
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="mr-auto">
                            <UsersMenuItem/>
                            <UserGroupsMenuItem/>
                            <ConnectorsMenuItem/>
                            <ConnectionsMenuItem/>
                            <SchedulesMenuItem/>
                            <AdminCardsMenuItem/>
                        </Nav>
                    </Navbar.Collapse>
                    <Nav className="ml-auto" style={{flexDirection: 'row'}}>
                        <MyProfileMenuItem/>
                        <LogoutMenuItem/>
                    </Nav>
                </Suspense>
                <Navbar.Toggle aria-controls="basic-navbar-nav" style={{borderColor: 'white'}}>
                    <TooltipFontIcon value={'menu'} tooltip={t('HEADER.HEADER.MENU')} style={{color: 'white'}} tooltipPosition={'bottom'}/>
                </Navbar.Toggle>
            </Navbar>
        );
    }
}

export default Header;