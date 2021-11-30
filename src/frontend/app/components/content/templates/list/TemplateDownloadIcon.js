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

import React from 'react';
import PropTypes from 'prop-types';
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import {connect} from "react-redux";
import {exportTemplate} from "@actions/templates/fetch";
import CVoiceControl from "@classes/voice_control/CVoiceControl";
import CTemplateVoiceControl from "@classes/voice_control/CTemplateVoiceControl";

@connect(null, {exportTemplate})
class TemplateDownloadIcon extends React.Component{
    constructor(props) {
        super(props);
    }

    componentDidMount(){
        CVoiceControl.initCommands({component:this}, CTemplateVoiceControl);
    }

    componentWillUnmount(){
        CVoiceControl.removeCommands({component:this}, CTemplateVoiceControl);
    }

    exportTemplate(e, template){
        this.props.exportTemplate(template);
    }

    render(){
        const {index, template} = this.props;
        return(
            <TooltipFontIcon
                id={`template_download_${index}`}
                isButton={true}
                turquoiseTheme
                size={'24px'}
                style={{cursor: 'pointer'}}
                value={'get_app'}
                tooltip={'Download'}
                onClick={(e) => ::this.exportTemplate(e, template)}
            />
        );
    }
}

TemplateDownloadIcon.propTypes = {
    index: PropTypes.number.isRequired,
    template: PropTypes.node.isRequired,
};

export default TemplateDownloadIcon;