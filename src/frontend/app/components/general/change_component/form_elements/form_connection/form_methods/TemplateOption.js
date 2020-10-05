import React from "react";
import styles from "@themes/default/general/basic_components";
import TemplateConversionIcon from "@components/general/app/TemplateConversionIcon";
import {connect} from "react-redux";

function mapStateToProps(state){
    const app = state.get('app');
    return{
        appVersion: app.get('appVersion'),
    };
}

@connect(mapStateToProps, {})
class TemplateOption extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const { innerProps, isDisabled, isSelected, appVersion,...props } = this.props;
        /*
        * TODO: Change comparison from description to version
        */
        let invalidVersion = props.data.description !== appVersion;
        return !isDisabled
            ?
            (
                <div {...innerProps} onClick={invalidVersion ? null : innerProps.onClick} className={`${styles.select_option} ${isSelected || invalidVersion ? '' : styles.select_option_hover} ${isSelected ? styles.selected_option : ''}`}>
                    <span className={`${invalidVersion ? styles.option_invalid : ''}`}>{props.label}</span>
                    <TemplateConversionIcon data={props.data} classNameIcon={styles.convert}/>
                </div>
            )
            :
            null
    }
}

export default TemplateOption;