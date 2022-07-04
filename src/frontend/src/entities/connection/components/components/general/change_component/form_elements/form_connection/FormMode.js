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
import {connect} from 'react-redux';

import styles from '@entity/connection/components/themes/default/general/form_methods.scss';
import {FormElement} from "@entity/connection/components/decorators/FormElement";
import Confirmation from "../../../app/Confirmation";
import Loading from "@loading";
import {EXPERT_MODE, TEMPLATE_MODE} from "@entity/connection/components/classes/components/content/connection/CTemplate";
import CConnection from "@entity/connection/components/classes/components/content/connection/CConnection";
import {CONNECTOR_FROM, CONNECTOR_TO} from "@entity/connection/components/classes/components/content/connection/CConnectorItem";
import {getTemplatesByConnectors as fetchTemplates, deleteTemplateById as deleteTemplate} from "@entity/template/redux_toolkit/action_creators/TemplateCreators";
import {
    DeleteTemplateButtonStyled,
    ExpertButtonStyled,
    TemplateButtonStyled
} from "@change_component/form_elements/form_connection/styles";
import InputSelect from "@app_component/base/input/select/InputSelect";
import {TextSize} from "@app_component/base/text/interfaces";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import InputTextarea from "@app_component/base/input/textarea/InputTextarea";
import {ColorTheme} from "@style/Theme";
import TemplateConversionIcon from "@entity/connection/components/components/general/app/TemplateConversionIcon";

function mapStateToProps(state){
    const authUser = state.authReducer.authUser;
    const template = state.templateReducer;
    return {
        authUser,
        templates: template.templates,
        fetchingTemplates: template.gettingTemplates,
        error: template.error,
    };
}


/**
 * Form for Connection Mode
 */
@connect(mapStateToProps, {fetchTemplates, deleteTemplate})
@FormElement()
class FormMode extends Component{

    constructor(props){
        super(props);

        const {entity, templates, data} = props;
        let template = null;
        let value = entity.template.templateId;
        if(value !== -1){
            template = templates.find(t => t.templateId === value);
            if(!template){
                template = null;
            } else{
                template = {...template};
                template.label = template.name;
                template.value = template.templateId;
            }
        }
        this.state = {
            showConfirm: false,
            onDeleteButtonOver: false,
            showConfirmDelete: false,
            template,
            currentWidth: window.innerWidth,
        };
    }

    componentDidMount(){
        const {entity, updateEntity, data} = this.props;
        if(data.mode === TEMPLATE_MODE && entity.allTemplates.length === 0){
            this.fetchTemplates();
        }
        if(data.connectors){
            let connector = data.connectors.find(c => c.id === entity.fromConnector.id);
            if(connector) entity.fromConnector.invoker = connector.invoker;
            connector = data.connectors.find(c => c.id === entity.toConnector.id);
            if(connector) entity.toConnector.invoker = connector.invoker;
            updateEntity(entity);
        }
        window.addEventListener('resize', this.resize, false);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.resize, false);
    }

    isEqualTwoTemplates(oldTemplates, newTemplates){
        if(oldTemplates.length !== newTemplates.length){
            return false;
        }
        for(let i = 0; i < oldTemplates.length; i++){
            if(oldTemplates[i].templateId !== newTemplates[i].templateId){
                return false;
            }
        }
        return true;
    }

    resize = (e) => {
        this.setState({currentWidth: e.target.innerWidth});
    };
    
    /**
     * to fetch templates
     */
    fetchTemplates(){
        const {fetchTemplates, entity, updateEntity} = this.props;
        let from = entity.fromConnector.id;
        let to = entity.toConnector.id;
        fetchTemplates({from, to});
        this.setState({template: null});
        entity.template.templateId = -1;
        entity.template.label = '';
        updateEntity(entity);
    }

    /**
     * to toggle showConfirmDelete state
     */
    toggleConfirmDelete(){
        if(this.state.template !== null) {
            this.setState({showConfirmDelete: !this.state.showConfirmDelete});
        }
    }

    /**
     * to set true onDeleteButtonOver
     */
    isOnDeleteButtonOver(){
        if(this.state.template !== null) {
            this.setState({onDeleteButtonOver: true});
        }
    }

    /**
     * to set false onDeleteButtonOver
     */
    isNotOnDeleteButtonOver(){
        if(this.state.template !== null) {
            this.setState({onDeleteButtonOver: false});
        }
    }

    /**
     * to show and hide confirmation dialog
     */
    toggleConfirm(e, value){
        const {showConfirm} = this.state;
        const {entity, data} = this.props;

        if(value === TEMPLATE_MODE){
            this.fetchTemplates();
        }
        if(entity.fromConnector.getCurrentItem() === null && entity.toConnector.getCurrentItem() === null){
            data.setMode(value, () => this.handleChangeMode())
        } else {
            this.setState({showConfirm: !showConfirm});
            data.setMode(value);
        }
    }

    /**
     * to update entity values
     */
    handleChangeMode(){
        const {showConfirm} = this.state;
        let {entity, updateEntity, data, clearValidationMessage} = this.props;
        const {readOnly} = data;
        if(readOnly){
            return;
        }
        entity.template = {mode: data.mode};
        entity.resetToEmptyTemplate();
        if(showConfirm) {
            this.setState({showConfirm: !showConfirm}, () => updateEntity(entity));
        } else{
            updateEntity(entity);
        }

        if(typeof clearValidationMessage === 'function'){
            clearValidationMessage();
        }
    };

    /**
     * tmp solution
     * to update template values of entity
     */
    handleChangeTemplate(template){
        let {entity, updateEntity, data} = this.props;
        let newTemplate = entity.template;
        let {connectors} = data;
        newTemplate.template = template.value;
        let templateContent = CConnection.createConnection({...template.content});
        //fromConnector
        let connector = connectors.find(c => c.id === templateContent.fromConnector.id);
        templateContent.fromConnector.invoker = connector.invoker;
        templateContent.fromConnector.setCurrentItem(templateContent.fromConnector.methods[templateContent.fromConnector.methods.length - 1]);
        templateContent.fromConnector.setConnectorType(CONNECTOR_FROM);
        templateContent.fromConnector.title = entity.fromConnector.title;
        entity.fromConnector = templateContent.fromConnector;
        entity.fromConnector.setHeadersForMethods();
        //toConnector
        connector = connectors.find(c => c.id === templateContent.toConnector.id);
        templateContent.toConnector.invoker = connector.invoker;
        templateContent.toConnector.setConnectorType(CONNECTOR_TO);
        templateContent.toConnector.title = entity.toConnector.title;
        templateContent.toConnector.setCurrentItem(templateContent.toConnector.methods[templateContent.toConnector.methods.length - 1]);
        entity.toConnector = templateContent.toConnector;
        entity.toConnector.setHeadersForMethods();
        //fieldBinding
        entity.fieldBinding = templateContent.fieldBinding;
        entity.template.templateId = template.value;
        entity.template.label = template.label;
        updateEntity(entity, 'template');
        this.setState({template});
    };

    /**
     * to delete template
     */
    deleteTemplate(){
        const {template} = this.state;
        const {deleteTemplate, entity, updateEntity} = this.props;
        if(template !== null) {
            deleteTemplate(template.value);
            entity.template.templateId = -1;
            entity.template.label = '';
            entity.resetToEmptyTemplate();
            updateEntity(entity);
            this.toggleConfirmDelete();
            this.setState({template: null});
        }
    }

    getTemplatesOptions(){
        let result = [];
        const {entity, templates} = this.props;
        for(let i = 0; i < templates.length; i++){
            result.push({version: templates[i].version, value: templates[i].templateId, label: templates[i].name, description: templates[i].description, content: templates[i].connection, template: templates[i]});
        }
        entity.allTemplates = templates;
        return result;
    }

    renderTemplateDescription(options){
        if(options.length === 0){
            return null;
        }
        const {template} = this.state;
        let value = template ? options.find(option => option.value === template.value) : null;
        if(!value || !(value.hasOwnProperty('description'))){
            value = 'Here you will see the description of the template';
        } else{
            value = !value.description ? 'There is no description for this template' : value.description;
        }
        return(
            <InputTextarea
                label={' '}
                name={'template_description'}
                type={'text'}
                value={value}
                readOnly={true}
                icon={'notes'}
            />
        )
    }

    renderTemplateSelect(){
        const {onDeleteButtonOver, showConfirmDelete, template, currentWidth} = this.state;
        const {entity, data, authUser, fetchingTemplates} = this.props;
        let {readOnly, error} = data;
        let {mode} = data;
        let isDeleteEnabled = template;
        let deleteButtonStyle = {};
        if(isDeleteEnabled){
            deleteButtonStyle.cursor = 'pointer';
        } else{
            deleteButtonStyle.cursor = 'default';
        }
        if(mode === TEMPLATE_MODE) {
            if(fetchingTemplates === API_REQUEST_STATE.START){
                return <Loading authUser={authUser} className={styles.connection_mode_loading}/>;
            }
            let options = this.getTemplatesOptions();
            if(options.length === 0){
                return(
                    <div className={styles.no_templates}>
                        <span>There is no templates</span>
                        {error && <div className={styles.no_templates_error}>{error}</div>}
                    </div>
                );
            }
            return (
                <div className={`second-tour-step ${styles.template_select}`}>
                    <div style={{position: "relative"}}>
                        <InputSelect
                            id={'templates'}
                            error={error}
                            label={'Templates'}
                            icon={'file_copy'}
                            className={styles.form_mode_template}
                            name={'connection_mode'}
                            value={template}
                            onChange={(a) => this.handleChangeTemplate(a)}
                            options={options}
                            placeholder={`Choose template`}
                            isDisabled={readOnly}
                            isSearchable={!readOnly}
                            getOptionRightComponent={(option) => {return (<TemplateConversionIcon id={entity.id.toString()} classNameIcon={styles.conversion_icon} data={{template: option.template}} blueTheme={true}/>);}}
                        />
                        <DeleteTemplateButtonStyled
                            tooltip={'Delete'}
                            position={'bottom'}
                            target={'delete_template_button'}
                            color={ColorTheme.Blue}
                            hasBackground={false}
                            isDisabled={!isDeleteEnabled}
                            icon={onDeleteButtonOver ? 'delete_forever' : 'delete'}
                            onMouseOver={(a) => this.isOnDeleteButtonOver(a)}
                            onMouseLeave={(a) => this.isNotOnDeleteButtonOver(a)}
                            onClick={(a) => this.toggleConfirmDelete(a)}
                        />
                    </div>
                    {this.renderTemplateDescription(options)}
                    <Confirmation
                        okClick={(a) => this.deleteTemplate(a)}
                        cancelClick={(a) => this.toggleConfirmDelete(a)}
                        active={showConfirmDelete}
                        title={'Confirmation'}
                        message={'Do you really want to remove?'}
                    />
                </div>
            );
        }
        return null;
    }

    renderConfirmation(){
        const {showConfirm} = this.state;
        const {data} = this.props;
        let {confirmationLabels} = data;
        return (
            <Confirmation
                okClick={(a) => this.handleChangeMode(a)}
                cancelClick={(a, b) => this.toggleConfirm(a, b)}
                active={showConfirm}
                title={confirmationLabels.title}
                message={confirmationLabels.message}
            />
        );
    }

    render(){
        const {authUser, entity, data} = this.props;
        let {modeLabels, tourStep, mode} = data;
        if(!tourStep){
            tourStep = '';
        }
        return (
            <React.Fragment>
                <div className={`${tourStep}`} style={{margin: '20px 65px 0'}}>
                    <div style={{textAlign: 'center'}}>
                        <ExpertButtonStyled
                            size={TextSize.Size_16}
                            isActive={mode === EXPERT_MODE}
                            authUser={authUser}
                            title={modeLabels.expert}
                            onClick={(e) => this.toggleConfirm(e, EXPERT_MODE)}
                        />
                        <TemplateButtonStyled
                            size={TextSize.Size_16}
                            isActive={mode === TEMPLATE_MODE}
                            authUser={authUser}
                            title={modeLabels.template}
                            onClick={(e) => this.toggleConfirm(e, TEMPLATE_MODE)}
                        />
                    </div>
                </div>
                {this.renderTemplateSelect()}
                {this.renderConfirmation()}
            </React.Fragment>
        );
    }
}

FormMode.propTypes = {
    entity: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
    updateEntity: PropTypes.func.isRequired,
};

export default FormMode;