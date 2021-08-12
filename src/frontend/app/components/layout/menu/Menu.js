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

import React, { Component,  }  from 'react';
import {connect} from 'react-redux';
import {withTranslation} from "react-i18next";
import {Roles} from '@utils/constants/app';

import {componentAppear} from "@utils/app";
import styles from '@themes/default/layout/menu.scss';
import ConnectorsMenuItem from "@components/layout/menu/ConnectorsMenuItem";
import AdminMenuItem from "@components/layout/menu/AdminMenuItem";
import ConnectionsMenuItem from "@components/layout/menu/ConnectionsMenuItem";
import SchedulesMenuItem from "@components/layout/menu/SchedulesMenuItem";
import LogoutMenuItem from "@components/layout/menu/LogoutMenuItem";
import LogoOcWhiteImagePath from "@images/logo_oc_white.png";
import {MenuIcon, MenuLinkLogo} from "@components/layout/menu/MenuLink";


function mapStateToProps(state){
    const auth = state.get('auth');
    const app = state.get('app');
    return {
        isAuth: auth.get('isAuth'),
        fromLogin: auth.get('fromLogin'),
        authUser: auth.get('authUser'),
        role: auth.get('authUser') ? auth.get('authUser').role : Roles.GUEST,
        logining: auth.get('logining'),
        logouting: auth.get('logouting'),
        isOneFormSectionFullScreen: app.get('isFullScreen'),
    };
}

/**
 * Header Component
 */
@connect(mapStateToProps, {})
@withTranslation('layout')
class Menu extends Component{

    constructor(props){
        super(props);

        this.state = {
            visible: !props.fromLogin,
            isExpanded: false,
            currentPath: props.router.getCurrentLocation().pathname,
            isMouseOver: false,
        };
    }

    componentDidMount(){
        if(!this.state.visible) {
            setTimeout(() => this.setState({visible: true},() => this.showComponent('app_header')), 1000);
        } else{
            this.showComponent();
        }
    }

    componentDidUpdate(){
        let pathName = this.props.router.getCurrentLocation().pathname;
        if(this.state.currentPath !== pathName) {
            this.setState({
                currentPath: pathName,
            });
        }
        let bodyElement = document.querySelector('body');
        if(bodyElement){
            if(this.props.isOneFormSectionFullScreen){
                bodyElement.classList.add(styles.body_without_menu);
            } else {
                bodyElement.classList.remove(styles.body_without_menu);
            }
        }
    }

    setMouseOver(){
        this.setState({
            isMouseOver: true,
        });
    }

    setMouseLeave(){
        this.setState({
            isMouseOver: false,
        });
    }

    showComponent(){
        let bodyElement = document.querySelector('body');
        if(bodyElement){
            bodyElement.classList.add(styles.html_body);
            componentAppear('app_header');
        }
    }

    componentWillUnmount() {
        let bodyElement = document.querySelector('body');
        if(bodyElement){
            bodyElement.classList.remove(styles.html_body);
        }
    }

    /**
     * to toggle menu
     *
     * @param isExpanded - expand and undo
     */
    onToggleMenu(isExpanded){
        this.setState({
            isExpanded: !this.state.isExpanded,
        });
        let bodyElement = document.querySelector('body');
        if(bodyElement) bodyElement.classList.toggle(styles.body_pd);
    }

    render(){
        const {visible, isMouseOver} = this.state;
        const {isOneFormSectionFullScreen} = this.props;
        let isExpanded = isMouseOver ? true : this.state.isExpanded;
        if(!visible){
            return null;
        }
        let navbarClassName = styles.navbar;
        if(isExpanded){
            navbarClassName += ` ${styles.expander}`;
        }
        if(isOneFormSectionFullScreen){
            navbarClassName += ` ${styles.hidden}`;
        }
        return(
            <div className={navbarClassName} id="navbar" onMouseOver={::this.setMouseOver} onMouseLeave={::this.setMouseLeave} onFocus={::this.setMouseOver} onBlur={::this.setMouseLeave}>
                <nav className={styles.main_menu_nav}>
                    <div>
                        <div className={styles.nav_brand}>
                            <MenuLinkLogo/>
                            <MenuIcon className={styles.nav_toggle} isButton whiteTheme value={this.state.isExpanded ? 'menu_open' : 'menu'} onClick={::this.onToggleMenu}/>
                        </div>
                        <div>
                            <ConnectorsMenuItem/>
                            <ConnectionsMenuItem/>
                            <SchedulesMenuItem/>
                            <AdminMenuItem isMainMenuExpanded={isExpanded}/>
                        </div>
                    </div>
                    <LogoutMenuItem/>
                </nav>
            </div>
        );
    }
}

export default Menu;