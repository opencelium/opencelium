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
import {connect} from 'react-redux';
import {withTranslation} from "react-i18next";

import {componentAppear, getThemeClass} from "@utils/app";
import styles from '@themes/default/layout/footer.scss';


function mapStateToProps(state){
    const auth = state.get('auth');
    const app = state.get('app');
    return {
        authUser: auth.get('authUser'),
        fromLogin: auth.get('fromLogin'),
        appVersion: app.get('appVersion'),
    };
}

/**
 * App Footer
 */
@connect(mapStateToProps, {})
@withTranslation('layout')
class Footer extends Component{

    constructor(props){
        super(props);
        this.state = {
            visible: !props.fromLogin,
        };
    }

    componentDidMount(){
        if(!this.state.visible) {
            setTimeout(() => this.setState({visible: true}, () => componentAppear('app_footer')), 1000);
        } else{
            componentAppear('app_footer');
        }
    }

    render(){
        const {visible} = this.state;
        const {authUser, t, appVersion} = this.props;
        if(!visible){
            return null;
        }
        let classNames = ['footer', 'open_celium', 'logo_icon_bottom_right'];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <footer className={styles[classNames.footer]} id={'app_footer'}>
                <div className={styles[classNames.logo_icon_bottom_right]}/>
                <div className={styles[classNames.open_celium]}><span title={appVersion}>{t('FOOTER.OPENCELIUM')}</span></div>
            </footer>
        );
    }
}

export default Footer;