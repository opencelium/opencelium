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


/**
 * FontIcon Component
 */
class FontIcon extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {onClick, id, className, iconClassName, isButton, darkTheme, blueTheme, iconStyles, value, ...props} = this.props;
        let theme = darkTheme === true ? styles.dark_theme : '';
        if(blueTheme === true){
            theme = styles.blue_theme;
        }
        if(value === 'loading'){
            return(
                <Loading className={styles.loading_icon}/>
            );
        }
        if(isString(value)) {
            if (isButton) {
                return (
                    <button className={`${styles.clear_button} ${theme} ${className}`} onClick={onClick} id={id}>
                        <ToolboxFontIcon value={value} className={iconClassName} {...props} style={{...iconStyles}}/>
                    </button>
                );
            } else {
                return (
                    <ToolboxFontIcon value={value} className={className} {...props} onClick={onClick} id={id}/>
                );
            }
        } else{
            return value;
        }
    }
}

FontIcon.propTypes = {
    isButton: PropTypes.bool,
    iconStyles: PropTypes.object,
    darkTheme: PropTypes.bool,
    blueTheme: PropTypes.bool,
};

FontIcon.defaultProps = {
    isButton: false,
    iconStyles: {},
    darkTheme: true,
    blueTheme: false,
};

export default FontIcon;