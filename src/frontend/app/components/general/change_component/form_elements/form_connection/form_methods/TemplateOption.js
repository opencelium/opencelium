import React from "react";
import {connect} from "react-redux";
import styles from "@themes/default/general/basic_components";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import {updateTemplate, updateTemplateRejected} from "@actions/templates/update";
import CExecution from "@classes/components/content/template_converter/CExecutions";

/*
* TODO: Get application version from backend
*/
const APPLICATION_VERSION = '2';

function mapStateToProps(state){
    const auth = state.get('auth');
    return{
        authUser: auth.get('authUser')
    };
}

@connect(mapStateToProps, {updateTemplate})
class TemplateOption extends React.Component{
    constructor(props) {
        super(props);
    }

    convert(){
        /*
        * TODO: Change from description to version
        */
        let {data, updateTemplate, updateTemplateRejected} = this.props;
        let {template} = data;
        const {jsonData, error} = CExecution.executeConfig({fromVersion: data.description, toVersion: APPLICATION_VERSION}, data.content);
        if(error.message !== ''){
            updateTemplateRejected(error);
        } else {
            template = {...template, connection: jsonData, description: APPLICATION_VERSION};
            updateTemplate({...template});
        }
    }

    render(){
        const { innerProps, isDisabled, isSelected, ...props } = this.props;
        /*
        * TODO: Change comparison from description to version
        */
        let invalidVersion = props.data.description !== APPLICATION_VERSION;
        let convertUp = invalidVersion && props.data.description < APPLICATION_VERSION;
        return !isDisabled
            ?
            (
                <div {...innerProps} onClick={invalidVersion ? null : innerProps.onClick} className={`${styles.select_option} ${isSelected || invalidVersion ? '' : styles.select_option_hover} ${isSelected ? styles.selected_option : ''}`}>
                    <span className={`${invalidVersion ? styles.option_invalid : ''}`}>{props.label}</span>
                    {invalidVersion &&
                    <TooltipFontIcon className={styles.convert} tooltip={`Convert ${convertUp ? 'Up' : 'Down'}`} value={convertUp ? 'trending_up' : 'trending_down'} onClick={::this.convert}/>
                    }
                </div>
            )
            :
            null
    }
}

export default TemplateOption;