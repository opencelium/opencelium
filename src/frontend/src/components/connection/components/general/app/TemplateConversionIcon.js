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
import {connect} from "react-redux";
import {updateTemplate as convertTemplate} from "@action/connection/TemplateCreators";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import CExecution from "@classes/components/content/template_converter/CExecution";
import CVoiceControl from "@classes/voice_control/CVoiceControl";
import CTemplateVoiceControl from "@classes/voice_control/CTemplateVoiceControl";

function mapStateToProps(state){
    const appVersion = state.applicationReducer.version;
    const authUser = state.authReducer.authUser;
    const template = state.templateReducer;
    return{
        appVersion,
        authUser,
        //convertingTemplates: template.get('convertingTemplates').toJS(),
    };
}

@connect(mapStateToProps, {convertTemplate})
class TemplateConversionIcon extends Component{
    constructor(props) {
        super(props);
    }

    componentDidMount(){
        CVoiceControl.initCommands({component:this}, CTemplateVoiceControl);
    }

    componentWillUnmount(){
        CVoiceControl.removeCommands({component:this}, CTemplateVoiceControl);
    }

    convert(){
        let {appVersion, data, convertTemplate} = this.props;
        let {template} = data;
        const {jsonData, error} = CExecution.executeConfig({fromVersion: template.version, toVersion: appVersion}, template.connection);
        template = {...template, connection: jsonData, version: appVersion, id: template.templateId};
        delete template.templateId;
        convertTemplate({...template});
    }

    /*
    * TODO: add loading during the conversion a few templates
    */
    render(){
        const {appVersion, data} = this.props;
        let {classNameIcon} = this.props;
        let invalidVersion = data.template.version !== appVersion;
        let styleIcon = {};
        styleIcon.transform = 'scaleX(-1) rotate(-45deg)';
        styleIcon.margin = 0;
        return(
            <React.Fragment>
                {
                    invalidVersion &&
                    <TooltipFontIcon turquoiseTheme isButton={true} className={classNameIcon} iconStyles={styleIcon} tooltip={'Upgrade'} value={'replay'} onClick={() => this.convert()} size={'24px'}/>
                }
            </React.Fragment>
        );
    }
}

TemplateConversionIcon.propTypes = {
    data: PropTypes.shape({
        template: PropTypes.object.isRequired,
    }).isRequired,
    classNameIcon: PropTypes.string,
};

export default TemplateConversionIcon;