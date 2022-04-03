

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

import React from 'react';
import PropTypes from 'prop-types';
import FontIcon from "@basic_components/FontIcon";
import styles from "@themes/default/content/update_assistant/main";
import CExecution from "@classes/components/content/template_converter/CExecution";
import {connect} from "react-redux";
import Loading from "@loading";

function mapStateToProps(state){
    const authUser = state.authReducer.authUser;
    const application = state.applicationReducer;
    return {
        authUser,
        appVersion: application.version,
    }
}

@connect(mapStateToProps, {})
class TemplateFileEntry extends React.Component{
    constructor(props) {
        super(props);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(!prevProps.isConverting && this.props.isConverting){
            this.convertTemplate();
        }
    }

    convertTemplate(){
        const {index, template, entity, setTemplate} = this.props;
        const {link, ...templateData} = template;
        let convertedTemplate = null;
        let status = null;
        const {jsonData, error} = CExecution.executeConfig({
            fromVersion: template.version,
            toVersion: entity.availableUpdates.selectedVersion.name,
        }, template.connection);
        if (error.message !== '') {
        //if(Math.floor(Math.random() * 2)){
            status = {error};
        }
        convertedTemplate = JSON.stringify({...templateData, connection: jsonData, version: entity.availableUpdates.selectedVersion.name});
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
            <tr>
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