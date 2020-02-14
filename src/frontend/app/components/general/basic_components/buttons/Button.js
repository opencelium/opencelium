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
import styles from '../../../../themes/default/general/basic_components.scss';
import {getThemeClass} from "../../../../utils/app";
import FontIcon from "../FontIcon";


/**
 * Button Component of App
 */
class Button extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {authUser, title, icon, disabled, onClick, isActive, ...props} = this.props;
        let {className} = this.props;
        let classNames = [
            'button',
            'active_button',
            'button_icon',
            'button_title',
            'button_disable',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        className = `${className} ${disabled ? styles[classNames.button_disable] : isActive ? styles[classNames.active_button] : styles[classNames.button]}`;
        return (
            <div {...props} className={className} onClick={disabled || isActive ? null : onClick}>
                {
                    icon !== ''
                    ?
                        <FontIcon value={icon} className={styles[classNames.button_icon]}/>
                    :
                        null
                }
                <span style={{cursor: disabled || isActive ? 'default' : 'pointer'}}>{title}</span>
            </div>
        );
    }
}

Button.propTypes = {
    authUser: PropTypes.object,
    title: PropTypes.string,
    icon: PropTypes.string,
    disabled: PropTypes.bool,
    isActive: PropTypes.bool,
};

Button.defaultProps = {
    authUser: null,
    className: '',
    icon: '',
    disabled: false,
    title: '',
    isActive: false,
};

export default Button;