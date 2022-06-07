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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from "react-redux";
import {updateTemplate as convertTemplate} from "@entity/template/redux_toolkit/action_creators/TemplateCreators";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import CExecution from "@entity/connection/components/classes/components/content/template_converter/CExecution";

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
        //CVoiceControl.initCommands({component:this}, CTemplateVoiceControl);
    }

    componentWillUnmount(){
        //CVoiceControl.removeCommands({component:this}, CTemplateVoiceControl);
    }

    convert(){
        let {appVersion, data, convertTemplate} = this.props;
        let {template} = data;
        const {jsonData, error} = CExecution.executeConfig({fromVersion: template.version, toVersion: appVersion}, template.connection);
        template = {...template, connection: jsonData, version: appVersion};
        convertTemplate({...template});
    }

    /*
    * TODO: add loading during the conversion a few templates
    */
    render(){
        const {appVersion, data} = this.props;
        let {classNameIcon, turquoiseTheme, blueTheme} = this.props;
        let invalidVersion = data.template.version !== appVersion;
        let styleIcon = {};
        styleIcon.transform = 'scaleX(-1) rotate(-45deg)';
        styleIcon.margin = 0;
        return(
            <React.Fragment>
                {
                    invalidVersion &&
                    <TooltipFontIcon turquoiseTheme={turquoiseTheme} blueTheme={blueTheme} isButton={true} className={classNameIcon} iconStyles={styleIcon} tooltip={'Upgrade'} value={'replay'} onClick={() => this.convert()} size={'24px'}/>
                }
            </React.Fragment>
        );
    }
}

TemplateConversionIcon.propTypes = {
    data: PropTypes.shape({
        template: PropTypes.any.isRequired,
    }).isRequired,
    classNameIcon: PropTypes.string,
    turquoiseTheme: PropTypes.bool,
    blueTheme: PropTypes.bool,
};

TemplateConversionIcon.defaultProps = {
    turquoiseTheme: false,
    blueTheme: false,
}

export default TemplateConversionIcon;