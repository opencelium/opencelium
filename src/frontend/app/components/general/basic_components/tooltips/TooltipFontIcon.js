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
import Tooltip from 'react-toolbox/lib/tooltip';
import OCFontIcon from "../FontIcon";


const TooltipIcon = Tooltip(OCFontIcon);

/**
 * Tooltip Component for FontIcon
 */
class TooltipFontIcon extends Component{

    constructor(props){
        super(props);
    }

    render(){
        return (
            <TooltipIcon {...this.props}/>
        );
    }
}

TooltipFontIcon.propTypes = {
    value: PropTypes.string.isRequired,
    tooltip: PropTypes.string.isRequired,
};

TooltipFontIcon.defaultProps = {
    tooltipPosition: 'top',
};

export default TooltipFontIcon;