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
import {connect} from 'react-redux';
import {withTranslation} from 'react-i18next';

import {changeLanguage} from "@actions/app";
import {languages} from "@utils/constants/languages";
import {updateAuthUserLanguage} from "@actions/auth";

import styles from '@themes/default/layout/header.scss';
import MenuItem from "@basic_components/MenuItem";
import IconMenu from "@basic_components/IconMenu";

function mapStateToProps(state){
    const app = state.get('app');
    const auth = state.get('auth');
    return{
        currentLanguage: app.get('currentLanguage'),
        isAuth: auth.get('isAuth'),
    };
}

/**
 * (not used) Component to display multilanguage option
 */
@connect(mapStateToProps, {changeLanguage, updateAuthUserLanguage})
@withTranslation()
class MenuLanguages extends Component{

    constructor(props){
        super(props);
    }

    changeLocale(code){
        const {changeLanguage, isAuth, updateAuthUserLanguage} = this.props;
        if(isAuth) {
            updateAuthUserLanguage({currentLanguage: code});
        } else{
            changeLanguage({code});
        }
    }

    renderMenuLanguages(){
        const {currentLanguage, t} = this.props;
        return languages.map(language => {
            let disabled = false;
            if(language.code === currentLanguage) {
                disabled = true;
            }
            return (
                <MenuItem
                    key={language.code}
                    value={language.code}
                    icon='flag'
                    caption={t(language.translation)}
                    onClick={() => this.changeLocale(language.code)}
                    disabled={disabled}
                    theme={{icon: styles.link_icon}}
                />
            );
        });
    }

    render(){
        return (
            <IconMenu icon='language' position='topRight' menuRipple>
                {this.renderMenuLanguages()}
            </IconMenu>
        );
    }
}

export default MenuLanguages;