/*
 *  Copyright (C) <2022>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react';
import PropTypes from 'prop-types';
import FontIcon from "@entity/connection/components/components/general/basic_components/FontIcon";
import theme from "react-toolbox/lib/input/theme.css";
import styles from "@entity/connection/components/themes/default/hocs.scss";
import basicComponentsStyles from "@entity/connection/components/themes/default/general/basic_components.scss";
import {isString} from "@application/utils/utils";
import Loading from "@loading";
import TooltipFontIcon from "@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon";

class ToolboxThemeInput extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {icon, tourStep, style, label, required, iconClassName, hasFocusStyle, className, isFocused, labelClassName, inputElementClassName, iconTooltip, tooltipTourStep, inputElementText, inputElementStyle, hideInput, error, ...props} = this.props;
        return(
            <div className={`${className} ${icon !== '' ? theme.withIcon : ''} ${label !== '' ? theme.input : ''} ${styles.toolbox_theme_input} ${hasFocusStyle ? styles.input : ''} ${tourStep ? tourStep : ''}`} style={style} {...props}>
                {label !== '' && <div style={inputElementStyle} className={`${theme.inputElement} ${theme.filled} ${styles.label} ${inputElementClassName} ${hideInput ? styles.hide_label : ''}`}>{inputElementText}</div>}
                <div className={`${styles.content} ${hideInput ? styles.hide_label : ''}`}>
                    {this.props.children}
                </div>
                {isString(icon) && icon !== '' && icon !== 'loading' && iconTooltip ==='' && <FontIcon value={icon} className={`${theme.icon} ${styles.icon} ${iconClassName} ${isFocused ? styles.focused : ''}`}/>}
                {isString(icon) && icon !== '' && icon !== 'loading' && iconTooltip !== '' && <TooltipFontIcon value={icon} tooltip={iconTooltip} className={`${theme.icon} ${tooltipTourStep} ${styles.icon} ${iconClassName} ${isFocused ? styles.focused : ''}`}/>}
                {!isString(icon) && <span className={`${theme.icon} ${styles.icon} ${isFocused ? styles.focused : ''}`}>{icon}</span>}
                {icon === 'loading' && <Loading className={`${theme.icon} ${styles.loading_icon} ${isFocused ? styles.focused : ''}`}/>}
                <span className={theme.bar}/>
                {
                    label !== '' && (
                        <label style={error ? {color: '#de3226'} : null} className={`${theme.label} ${styles.label} ${labelClassName} ${isFocused ? styles.focused : ''}`}>
                            {label}
                            {required && <span className={theme.required}> *</span>}
                        </label>
                    )
                }
                {error && <span className={`${theme.error} ${basicComponentsStyles.input_error}`}>{error}</span>}
            </div>
        );
    }
}

ToolboxThemeInput.propTypes = {
    className: PropTypes.string,
    tourStep: PropTypes.string,
    style: PropTypes.object,
    required: PropTypes.bool,
    iconClassName: PropTypes.string,
    hasFocusStyle: PropTypes.bool,
    isFocused: PropTypes.bool,
    labelClassName: PropTypes.string,
    inputElementClassName: PropTypes.string,
    iconTooltip: PropTypes.string,
    tooltipTourStep: PropTypes.string,
    inputElementText: PropTypes.string,
    inputElementStyle: PropTypes.object,
    hideInput: PropTypes.bool,
};

ToolboxThemeInput.defaultProps = {
    className: '',
    inputElementText: '',
    icon: '',
    iconTooltip: '',
    tourStep: '',
    style: {},
    label: '',
    required: false,
    iconClassName: '',
    hasFocusStyle: true,
    isFocused: false,
    labelClassName: '',
    inputElementClassName: '',
    tooltipTourStep: '',
    inputElementStyle: {},
    hideInput: false,
    error: '',
};

export default ToolboxThemeInput;