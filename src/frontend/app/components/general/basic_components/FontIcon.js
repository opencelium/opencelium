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
import {FontIcon as ToolboxFontIcon} from "react-toolbox/lib/font_icon/FontIcon";
import styles from "@themes/default/general/basic_components.scss";
import Loading from "@components/general/app/Loading";


/**
 * FontIcon Component
 */
class FontIcon extends Component{

    constructor(props){
        super(props);
        this.icon = React.createRef();
    }

    render(){
        const {onClick, id, className, iconClassName, isButton, darkTheme, blueTheme, value, size, myRef, iconStyles, onButtonFocus, onButtonBlur, disabled, ...props} = this.props;
        let theme = darkTheme === true ? styles.dark_theme : '';
        let sizeStyle = {width: `${size}px`, height: `${size}px`};
        if(blueTheme === true){
            theme = styles.blue_theme;
        }
        if(disabled){
            theme = styles.disabled_item;
        }
        if(value === 'loading'){
            return(
                <Loading className={`${styles.loading_icon} ${className}`} spinnerStyle={{...sizeStyle}}/>
            );
        }
        if (isButton) {
            return (
                <button ref={myRef ? myRef : this.icon} disabled={disabled} className={`${styles.clear_button} ${theme} ${className}`} style={{...sizeStyle}} onClick={onClick} id={id} onFocus={onButtonFocus} onBlur={onButtonBlur}>
                    <ToolboxFontIcon value={value} className={iconClassName} {...props} style={{...iconStyles, fontSize: `${size}px`}}/>
                </button>
            );
        } else {
            return (
                <span ref={myRef ? myRef : this.icon} >
                    <ToolboxFontIcon value={value} className={className} style={{...iconStyles, fontSize: `${size}px`}} {...props} onClick={onClick} id={id}/>
                </span>
            );
        }
    }
}

FontIcon.propTypes = {
    size: PropTypes.number,
    isButton: PropTypes.bool,
    iconStyles: PropTypes.object,
    darkTheme: PropTypes.bool,
    blueTheme: PropTypes.bool,
    onButtonBlur: PropTypes.func,
    onButtonFocus: PropTypes.func,
    disabled: PropTypes.bool,
};

FontIcon.defaultProps = {
    size: 24,
    isButton: false,
    iconStyles: {},
    darkTheme: true,
    blueTheme: false,
    myRef: null,
    onButtonBlur: () => {},
    onButtonFocus: () => {},
    disabled: false,
};

export default FontIcon;