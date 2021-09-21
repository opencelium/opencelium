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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {FontIcon as ToolboxFontIcon} from "react-toolbox/lib/font_icon/FontIcon";
import styles from "@themes/default/general/basic_components.scss";
import Loading from "@loading";
import {isNumber, isString} from "@utils/app";
import Icons from "@utils/constants/icons";


/**
 * FontIcon Component
 */
class FontIcon extends Component{

    constructor(props){
        super(props);
        this.icon = React.createRef();
    }

    render(){
        let {onClick, id, className, iconClassName, isButton, darkTheme, turquoiseTheme, blueTheme, grayTheme, darkBlueTheme, whiteTheme, value, myRef, iconStyles, onButtonFocus, onButtonBlur, disabled, ...props} = this.props;
        let theme = darkTheme === true ? styles.dark_theme : '';
        let size = isNumber(this.props.size) ? `${this.props.size}px` : this.props.size;
        let sizeStyle = {width: `${size}px`, height: `${size}px`};
        if(turquoiseTheme === true){
            theme = styles.turquoise_theme;
        }
        if(blueTheme === true){
            theme = styles.blue_theme;
        }
        if(grayTheme === true){
            theme = styles.gray_theme;
        }
        if(whiteTheme === true){
            theme = styles.white_theme;
        }
        if(darkBlueTheme === true){
            theme = styles.dark_blue_theme;
        }
        if(disabled){
            theme = styles.disabled_item;
        }
        if(value === 'loading'){
            return(
                <Loading className={`${styles.loading_icon} ${className} ${theme}`} spinnerStyle={{...sizeStyle}}/>
            );
        }
        //rework it
        //here can be an image or just an icon
        //differ it
        const shouldBeReplaced = Icons.hasOwnProperty(value);
        if(shouldBeReplaced){
            value = Icons[value];
        }
        const isImageValue = isString(value) && value.indexOf('/') !== -1;
        if (isButton) {
            return (
                <button ref={myRef ? myRef : this.icon} disabled={disabled} className={`${styles.clear_button} ${theme} ${className}`} style={{...sizeStyle}} onClick={onClick} id={id} onFocus={onButtonFocus} onBlur={onButtonBlur}>
                    {isImageValue
                    ?
                        <img alt={''} src={value} className={iconClassName} width={size} height={size} style={{...iconStyles}}/>
                    :
                        <ToolboxFontIcon value={value} className={iconClassName} {...props}
                                         style={{...iconStyles, fontSize: size}}/>
                    }
                </button>
            );
        } else {
            return (
                <span ref={myRef ? myRef : this.icon} className={!darkTheme ? theme : ''} >
                    {isImageValue
                    ?
                        <img alt={''} src={value} className={iconClassName} width={size} height={size} style={{...iconStyles}} onClick={onClick} id={id}/>
                    :
                        <ToolboxFontIcon value={value} className={className}
                                         style={{...iconStyles, fontSize: size}} {...props} onClick={onClick}
                                         id={id}/>
                    }
                </span>
            );
        }
    }
}

FontIcon.propTypes = {
    size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    isButton: PropTypes.bool,
    iconStyles: PropTypes.object,
    darkTheme: PropTypes.bool,
    turquoiseTheme: PropTypes.bool,
    grayTheme: PropTypes.bool,
    whiteTheme: PropTypes.bool,
    darkBlueTheme: PropTypes.bool,
    blueTheme: PropTypes.bool,
    onButtonBlur: PropTypes.func,
    onButtonFocus: PropTypes.func,
    disabled: PropTypes.bool,
};

FontIcon.defaultProps = {
    size: 24,
    className: '',
    iconClassName: '',
    isButton: false,
    iconStyles: {},
    darkTheme: true,
    turquoiseTheme: false,
    blueTheme: false,
    whiteTheme: false,
    darkBlueTheme: false,
    grayTheme: false,
    myRef: null,
    onButtonBlur: () => {},
    onButtonFocus: () => {},
    disabled: false,
};

export default FontIcon;