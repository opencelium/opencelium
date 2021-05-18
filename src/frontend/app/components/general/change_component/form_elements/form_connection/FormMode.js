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
import {connect} from 'react-redux';

import styles from '@themes/default/general/form_methods.scss';
import {FormElement} from "@decorators/FormElement";
import Button from "@basic_components/buttons/Button";
import Select from "@basic_components/inputs/Select";
import Confirmation from "../../../app/Confirmation";
import {fetchTemplates} from "@actions/templates/fetch";
import {deleteTemplate} from '@actions/templates/delete';
import Loading from "@loading";
import {EXPERT_MODE, TEMPLATE_MODE} from "@classes/components/content/connection/CTemplate";
import CConnection from "@classes/components/content/connection/CConnection";
import {CONNECTOR_FROM, CONNECTOR_TO} from "@classes/components/content/connection/CConnectorItem";
import FontIcon from "@basic_components/FontIcon";
import {API_REQUEST_STATE} from "@utils/constants/app";
import Input from "@basic_components/inputs/Input";
import TemplateOption from "@change_component/form_elements/form_connection/form_methods/TemplateOption";
import {setFocusById} from "@utils/app";

function mapStateToProps(state){
    const auth = state.get('auth');
    const templates = state.get('templates');
    return {
        authUser: auth.get('authUser'),
        templates: templates.get('templates').toJS(),
        fetchingTemplates: templates.get('fetchingTemplates'),
        error: templates.get('error'),
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

        const {entity, templates} = props;
        let template = null;
        let value = entity.template.templateId;
        if(value !== -1){
            template = templates.find(t => t.templateId === value);
            if(!template){
                template = null;
            } else{
                template.label = template.name;
                template.value = template.templateId;
            }
        }
        this.state = {
            showConfirm: false,
            mode: '',
            onDeleteButtonOver: false,
            showConfirmDelete: false,
            startFetchingTemplates: false,
            template,
            currentWidth: window.innerWidth,
        };
    }

    componentDidMount(){
        const {entity} = this.props;
        if(entity.template.mode === TEMPLATE_MODE && entity.allTemplates.length === 0){
            this.fetchTemplates();
        }
        window.addEventListener('resize', this.resize, false);
        setFocusById('button_expert')
    }

    componentDidUpdate(prevProps){
        const {entity, error} = this.props;
        const {startFetchingTemplates} = this.state;
        let curFrom = entity.fromConnector.id;
        let curTo = entity.toConnector.id;
        if(entity.allTemplates.length > 0 && error === null){
            let prevFrom = entity.allTemplates[0].connection.fromConnector.connectorId;
            let prevTo = entity.allTemplates[0].connection.toConnector.connectorId;
            if(!startFetchingTemplates) {
                if (curFrom !== prevFrom || curTo !== prevTo) {
                    this.fetchTemplates();
                }
            }
        }
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.resize, false);
    }

    static getDerivedStateFromProps(props){

        if (props.fetchingTemplates !== API_REQUEST_STATE.START) {
            return{
                startFetchingTemplates: false
            };
        }
        return null;
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
        this.setState({startFetchingTemplates: true, template: null});
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
        const {entity} = this.props;

        if(value === TEMPLATE_MODE){
            this.fetchTemplates();
        }
        if(entity.fromConnector.getCurrentItem() === null && entity.toConnector.getCurrentItem() === null){
            this.setState({mode: value}, this.handleChangeMode);
        } else {
            this.setState({showConfirm: !showConfirm, mode: value});
        }
    }

    /**
     * to update entity values
     */
    handleChangeMode(){
        const {mode, showConfirm} = this.state;
        let {entity, updateEntity, data, clearValidationMessage} = this.props;
        const {readOnly} = data;
        if(readOnly){
            return;
        }
        entity.template = {mode};
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
        let templateContent = CConnection.createConnection(template.content);
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
        updateEntity(entity);
        this.setState({template});
    };

    /**
     * to delete template
     */
    deleteTemplate(){
        const {template} = this.state;
        const {deleteTemplate, entity, updateEntity} = this.props;
        if(template !== null) {
            deleteTemplate({templateId: template.value});
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
            <Input
                name={'template_description'}
                type={'text'}
                value={value}
                multiline={true}
                rows={4}
                readOnly={true}
                className={styles.template_description}
            />
        );
    }

    renderTemplateSelect(){
        const {onDeleteButtonOver, showConfirmDelete, startFetchingTemplates, template, currentWidth} = this.state;
        const {entity, data, authUser} = this.props;
        let {readOnly} = data;
        let {mode} = entity.template;
        let isDeleteEnabled = template;
        let deleteButtonStyle = {};
        if(isDeleteEnabled){
            deleteButtonStyle.color = 'black';
            deleteButtonStyle.cursor = 'pointer';
        } else{
            deleteButtonStyle.color = 'gray';
            deleteButtonStyle.cursor = 'default';
        }
        if(mode === TEMPLATE_MODE) {
            if(startFetchingTemplates){
                return <Loading authUser={authUser} className={styles.connection_mode_loading}/>;
            }
            let options = this.getTemplatesOptions();
            if(options.length === 0){
                return(
                    <div className={styles.no_templates}>There is no templates</div>
                );
            }
            return (
                <div className={`second-tour-step ${styles.template_select}`}>
                    <Select
                        id={'templates'}
                        className={styles.form_mode_template}
                        name={'connection_mode'}
                        value={template}
                        components={{ Option: TemplateOption }}
                        onChange={::this.handleChangeTemplate}
                        options={options}
                        closeOnSelect={false}
                        placeholder={`Choose template`}
                        isDisabled={readOnly}
                        isSearchable={!readOnly}
                        openMenuOnClick={true}
                    />
                    <FontIcon
                        className={styles.item_delete_button}
                        style={{lineHeight: 0, ...deleteButtonStyle}}
                        value={onDeleteButtonOver ? 'delete_forever' : 'delete'}
                        onMouseOver={::this.isOnDeleteButtonOver}
                        onMouseLeave={::this.isNotOnDeleteButtonOver}
                        onClick={::this.toggleConfirmDelete}
                    />
                    {::this.renderTemplateDescription(options)}
                    <Confirmation
                        okClick={::this.deleteTemplate}
                        cancelClick={::this.toggleConfirmDelete}
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
                okClick={::this.handleChangeMode}
                cancelClick={::this.toggleConfirm}
                active={showConfirm}
                title={confirmationLabels.title}
                message={confirmationLabels.message}
            />
        );
    }

    render(){
        const {authUser, entity, data} = this.props;
        let {modeLabels, tourStep} = data;
        let {mode} = entity.template;
        if(!tourStep){
            tourStep = '';
        }
        return (
            <div className={`${tourStep}`} style={{margin: '20px 65px 0'}}>
                <div style={{textAlign: 'center'}}>
                    <Button
                        isActive={mode === EXPERT_MODE}
                        authUser={authUser}
                        title={modeLabels.expert}
                        onClick={(e) => ::this.toggleConfirm(e, EXPERT_MODE)}
                        className={styles.expert_button}
                    />
                    <Button
                        isActive={mode === TEMPLATE_MODE}
                        authUser={authUser}
                        title={modeLabels.template}
                        onClick={(e) => ::this.toggleConfirm(e, TEMPLATE_MODE)}
                        className={styles.template_button}
                    />
                </div>
                {::this.renderTemplateSelect()}
                {::this.renderConfirmation()}
            </div>
        );
    }
}

FormMode.propTypes = {
    entity: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
    updateEntity: PropTypes.func.isRequired,
};

export default FormMode;