/*
 * Copyright (C) <2022>  <becon GmbH>
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
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import {formatHtmlId} from "@utils/app";
import CVoiceControl from "@classes/voice_control/CVoiceControl";
import CHelpControl from "@classes/voice_control/CHelpControl";

/**
 * Component for displaying Help Icon in Content, List
 */
class HelpIcon extends Component{

    constructor(props){
        super(props);
    }

    componentDidMount(){
        CVoiceControl.initCommands({component:this}, CHelpControl);
    }

    componentWillUnmount(){
        CVoiceControl.removeCommands({component:this}, CHelpControl);
    }

    render(){
        const {onClick, id} = this.props;
        /*
        * TODO: remove stub as soon as all tour data will be fixed
        */
        return null;
        return (
            <sup>
                <TooltipFontIcon
                    grayTheme={true}
                    size={16}
                    value={'help_outline'}
                    tooltip={'Help'}
                    onClick={onClick}
                    id={`help_icon_${formatHtmlId(id)}`}
                    isButton={true}
                />
            </sup>
        );
    }
}

HelpIcon.propTypes = {
    onClick: PropTypes.func.isRequired,
    id: PropTypes.string.isRequired,
};

export default HelpIcon;