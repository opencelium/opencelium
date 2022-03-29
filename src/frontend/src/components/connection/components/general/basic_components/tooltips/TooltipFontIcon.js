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
import FontIcon from "../FontIcon";
import {isNumber} from "@utils/app";
import Tooltip from "@atom/tooltip/Tooltip";
import styles from "@themes/default/general/basic_components.scss";

/**
 * Tooltip Component for FontIcon
 */
class TooltipFontIcon extends Component{

    constructor(props){
        super(props);
        this.icon = React.createRef();
    }

    render(){
        let {tooltip, tooltipPosition, wrapClassName, wrapStyles, ...props} = this.props;
        let fontSize = this.props.size ? isNumber(this.props.size) ? `${this.props.size}px` : this.props.size : '24px';
        return (
            <Tooltip target={this.icon} tooltip={tooltip} position={'auto'} component={
                <span className={`${wrapClassName} ${styles.tooltip_elem}`} style={{fontSize, ...wrapStyles}}>
                    <FontIcon myRef={this.icon} {...props}/>
                </span>
            }/>
        );
    }
}

TooltipFontIcon.propTypes = {
    tooltip: PropTypes.string.isRequired,
    value: PropTypes.any.isRequired,
    isButton: PropTypes.bool,
    blueTheme: PropTypes.bool,
    darkBlueTheme: PropTypes.bool,
    turquoiseTheme: PropTypes.bool,
    grayTheme: PropTypes.bool,
    whiteTheme: PropTypes.bool,
    disabled: PropTypes.bool,
};

TooltipFontIcon.defaultProps = {
    tooltipPosition: 'top',
    isButton: false,
    wrapClassName: '',
    wrapStyles: {},
};

export default TooltipFontIcon;