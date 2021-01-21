import React from 'react';
import PropTypes from 'prop-types';
import FontIcon from "@basic_components/FontIcon";
import styles from "@themes/default/content/update_assistant/main";
import CExecution from "@classes/components/content/template_converter/CExecution";
import {connect} from "react-redux";
import {fetchTemplates} from "@actions/templates/fetch";
import {convertTemplates, convertTemplatesRejected} from "@actions/templates/update";
import Loading from "@components/general/app/Loading";

function mapStateToProps(state){
    const auth = state.get('auth');
    const app = state.get('app');
    const templates = state.get('templates');
    return {
        authUser: auth.get('authUser'),
        appVersion: app.get('appVersion'),
        fetchingTemplates: templates.get('fetchingTemplates'),
        templates: templates.get('templates').toJS(),
    }
}

@connect(mapStateToProps, {fetchTemplates, convertTemplates, convertTemplatesRejected})
class TemplateFileEntry extends React.Component{
    constructor(props) {
        super(props);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(!prevProps.isConverting && this.props.isConverting){
            ::this.convertTemplate();
        }
    }

    convertTemplate(){
        const {index, template, entity, setTemplate} = this.props;
        let convertedTemplate = null;
        let status = null;
        const {jsonData, error} = CExecution.executeConfig({
            fromVersion: template.version,
            toVersion: entity.availableUpdates.selectedVersion
        }, template.connection);
        //if (error.message !== '') {
        if(Math.floor(Math.random() * 2)){
            status = {error};
        }
        convertedTemplate = {...template, connection: jsonData, version: entity.availableUpdates.selectedVersion};
        setTimeout(() => {
            setTemplate(convertedTemplate, status, index);
        }, 100);
    }

    render(){
        const {convertedTemplates, index, isConverting, template} = this.props;
        let isFail = false;
        let isSuccess = false;
        if(typeof convertedTemplates[index] !== 'undefined'){
            isFail = convertedTemplates[index].status !== null;
            isSuccess = convertedTemplates[index].status === null;
        }
        return(
            <tr key={template.name}>
                <td>{template.name}</td>
                <td>
                    {!isConverting && !isFail && !isSuccess && <span>-</span>}
                    {isConverting && <Loading className={styles.convert_loading}/>}
                    {isSuccess && <FontIcon value={'done'} size={18} className={styles.convert_success}/>}
                    {isFail && <FontIcon value={'close'} size={18} className={styles.convert_fail}/>}
                </td>
            </tr>
        );
    }
}

TemplateFileEntry.defaultProps = {
    isConverting: false,
    status: null,
};

TemplateFileEntry.propTypes = {
    index: PropTypes.number.isRequired,
    isConverting: PropTypes.bool,
    template: PropTypes.object.isRequired,
    setTemplate: PropTypes.func.isRequired,
};

export default TemplateFileEntry;