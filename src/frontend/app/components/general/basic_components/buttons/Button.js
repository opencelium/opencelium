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
import {Button as BootstrapButton} from 'reactstrap';
import styles from '@themes/default/general/basic_components.scss';
import {getThemeClass, formatHtmlId, isString} from "@utils/app";
import FontIcon from "../FontIcon";


/**
 * Button Component of App
 */
class Button extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {authUser, icon, disabled, onClick, isActive, theme, ...props} = this.props;
        let buttonClassName = this.props.className;
        let {title} = this.props;
        let {id} = this.props;
        if(title === '' && this.props.children === null){
            return null;
        }
        let classNames = [
            'button_icon',
            'button_title',
            'ripple',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        id = id !== '' ? id : formatHtmlId(`button_${title}`);
        return (
            <BootstrapButton {...props} disabled={disabled} active={isActive} style={{overflow: 'hidden'}} className={`${buttonClassName} ${styles[classNames.ripple]}`} color="primary" onClick={disabled || isActive ? null : onClick} id={id}>
                {
                    icon !== '' && <FontIcon theme={theme} value={icon} className={styles[classNames.button_icon]}/>
                }
                {
                    title !== ''
                    ?
                        <span className={styles[classNames.button_title]} style={icon !== '' ? {marginLeft: '5px'} : {}}>{title}</span>
                    :
                        this.props.children
                }
            </BootstrapButton>
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
    id: '',
};

export default Button;