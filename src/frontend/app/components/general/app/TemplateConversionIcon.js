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
import {convertTemplate, convertTemplateRejected} from "@actions/templates/update";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import {Spinner} from "reactstrap";
import CExecution from "@classes/components/content/template_converter/CExecution";
import CVoiceControl from "@classes/voice_control/CVoiceControl";
import CTemplateVoiceControl from "@classes/voice_control/CTemplateVoiceControl";

function mapStateToProps(state){
    const app = state.get('app');
    const auth = state.get('auth');
    const templates = state.get('templates');
    return{
        appVersion: app.get('appVersion'),
        authUser: auth.get('authUser'),
        convertingTemplates: templates.get('convertingTemplates').toJS(),
    };
}

@connect(mapStateToProps, {convertTemplate, convertTemplateRejected})
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
        let {appVersion, data, convertTemplate, convertTemplateRejected} = this.props;
        let {template} = data;
        const {jsonData, error} = CExecution.executeConfig({fromVersion: template.version, toVersion: appVersion}, template.connection);
        if(error.message !== ''){
            convertTemplateRejected(error);
        } else {
            template = {...template, connection: jsonData, version: appVersion};
            convertTemplate({...template});
        }
    }

    render(){
        const {appVersion, convertingTemplates, data} = this.props;
        let {classNameIcon} = this.props;
        let invalidVersion = data.template.version !== appVersion;
        const isLoading = convertingTemplates.findIndex(t => t.templateId === data.template.templateId) !== -1;
        let styleIcon = {};
        styleIcon.transform = 'scaleX(-1) rotate(-45deg)';
        styleIcon.margin = 0;
        return(
            <React.Fragment>
                {
                    invalidVersion && !isLoading &&
                    <TooltipFontIcon isButton={true} className={classNameIcon} iconStyles={styleIcon} tooltip={'Upgrade'} value={'replay'} onClick={::this.convert} size={'1.6vw'}/>
                }
                {
                    isLoading &&
                    <Spinner type="grow" color="primary" className={classNameIcon}/>
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