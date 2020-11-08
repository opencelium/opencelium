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