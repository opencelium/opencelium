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
import {isString} from "@utils/app";
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
        let {onClick, id, className, iconClassName, isButton, darkTheme, blueTheme, grayTheme, value, size, myRef, iconStyles, onButtonFocus, onButtonBlur, disabled, ...props} = this.props;
        let theme = darkTheme === true ? styles.dark_theme : '';
        let sizeStyle = {width: `${size}px`, height: `${size}px`};
        if(blueTheme === true){
            theme = styles.blue_theme;
        }
        if(grayTheme === true){
            theme = styles.gray_theme;
        }
        if(disabled){
            theme = styles.disabled_item;
        }
        if(value === 'loading'){
            return(
                <Loading className={`${styles.loading_icon} ${className}`} spinnerStyle={{...sizeStyle}}/>
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
                                         style={{...iconStyles, fontSize: `${size}px`}}/>
                    }
                </button>
            );
        } else {
            return (
                <span ref={myRef ? myRef : this.icon} >
                    {isImageValue
                    ?
                        <img alt={''} src={value} className={iconClassName} width={size} height={size} style={{...iconStyles}} onClick={onClick} id={id}/>
                    :
                        <ToolboxFontIcon value={value} className={className}
                                         style={{...iconStyles, fontSize: `${size}px`}} {...props} onClick={onClick}
                                         id={id}/>
                    }
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
    grayTheme: PropTypes.bool,
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
    blueTheme: false,
    grayTheme: false,
    myRef: null,
    onButtonBlur: () => {},
    onButtonFocus: () => {},
    disabled: false,
};

export default FontIcon;