/*
 * Copyright (C) <2019>  <becon GmbH>
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
import Breadcrumbs from "./Breadcrumbs";
import Form from "./Form";
import Hint from "./Hint";
import Navigation from "./Navigation";
import {getInputsState, isNumber} from "../../../utils/app";
import ValidationMessage from "./ValidationMessage";
import {
    addChangeContentActionNavigation, addFocusDocumentNavigation,
    addNextPageChangeEntityKeyNavigation,
    addPrevPageChangeEntityKeyNavigation, removeChangeContentActionNavigation, removeFocusDocumentNavigation,
    removeNextPageChangeEntityKeyNavigation,
    removePrevPageChangeEntityKeyNavigation
} from "../../../utils/key_navigation";

import {isEmptyObject} from '../../../utils/app';
import CConnection from "../../../classes/components/content/connection/CConnection";
import {API_REQUEST_STATE} from "../../../utils/constants/app";
import {TEMPLATE_MODE} from "../../../classes/components/content/connection/CTemplate";
import CInvoker from "../../../classes/components/content/invoker/CInvoker";


/**
 * Change Content Component
 */
class ChangeContent extends Component{

    constructor(props){
        super(props);
        let inputs = props.contents.map(content => content.inputs);
        let onlyInputs = [];
        let entity = [];
        for(let i = 0; i < inputs.length; i++){
            onlyInputs = onlyInputs.concat(inputs[i]);
        }
        if(isEmptyObject(props.entity)){
            entity = getInputsState(onlyInputs);
        } else{
            entity = props.entity;
        }
        for(let i = 0; i < onlyInputs.length; i++){
            if(onlyInputs[i].hasOwnProperty('callback')){
                if(typeof onlyInputs[i].callback === 'function'){
                    onlyInputs[i].callback(entity[onlyInputs[i].name]);
                }
            }
        }

        this.state = {
            entity,
            page: 0,
            hasError: false,
            hasRequired: false,
            isValidated: true,
            focusedInput: {name: '', label: ''},
            validationMessage: '',
            makingRequest: false,
            contentsLength: props.contents ? props.contents.length : 0,
        };
    }

    componentDidMount(){
        addPrevPageChangeEntityKeyNavigation(this);
        addNextPageChangeEntityKeyNavigation(this);
        addChangeContentActionNavigation(this);
        addFocusDocumentNavigation(this);
    }

    componentWillUnmount(){
        removePrevPageChangeEntityKeyNavigation(this);
        removeNextPageChangeEntityKeyNavigation(this);
        removeChangeContentActionNavigation(this);
        removeFocusDocumentNavigation(this);
    }
/*
    static getDerivedStateFromProps(props, state){
        const {page, contentsLength} = state;
        let newContentsLength = props.contents.length;
        if(page < (contentsLength - 1)) {
            let contents = props.contents[page];
            for(let i = 0; i < contents.inputs.length; i++) {
                let newInputs = contents.inputs[i];
                if (newInputs.hasOwnProperty('request')) {
                    let request = newInputs.request;
                    if (request) {
                        if (request.inProcess) {
                            return {
                                makingRequest: true,
                                contentsLength: newContentsLength,
                            };
                        } else {
                            if (request && request.status === true) {
                                if (request.result.message === "EXISTS") {
                                    let isValidated = false;
                                    let focusedInput = {name: newInputs.name, label: newInputs.label};
                                    let validationMessage = request.notSuccessMessage;
                                    return{
                                        page: isValidated ? page + 1 : page,
                                        isValidated,
                                        validationMessage,
                                        focusedInput,
                                        makingRequest: false,
                                        contentsLength: newContentsLength,
                                    };
                                } else {
                                    return {
                                        makingRequest: false,
                                        contentsLength: newContentsLength,
                                    };
                                }
                            }
                        }
                    }
                }
            }

        }
        if(contentsLength !== newContentsLength) {
            return {
                contentsLength: newContentsLength,
            };
        }
        return null;
    }

    componentDidUpdate(){
        const {page, contentsLength} = this.state;
        if(page < (contentsLength - 1)) {
            let contents = this.props.contents[page];
            for(let i = 0; i < contents.inputs.length; i++) {
                let newInputs = contents.inputs[i];
                if (newInputs.hasOwnProperty('request')) {
                    let request = newInputs.request;
                    if (request) {
                        if (!request.inProcess) {
                            if (request && request.status === true) {
                                if (request.result.message !== "EXISTS") {
                                    this.nextPage(i + 1);
                                }
                                break;
                            }
                        }
                    }
                }
            }

        }
    }*/


    UNSAFE_componentWillReceiveProps (nextProps){
        const {page, contentsLength} = this.state;
        if(this.state.page < (contentsLength - 1)) {
            let contents = nextProps.contents[this.state.page];
            for(let i = 0; i < contents.inputs.length; i++) {
                let newInputs = contents.inputs[i];
                if (newInputs.hasOwnProperty('request')) {
                    let request = newInputs.request;
                    if (request) {
                        if (request.inProcess) {
                            this.setState({makingRequest: true});
                        } else {
                            if (request && request.status === true) {
                                if (request.result.message === "EXISTS") {
                                    let isValidated = false;
                                    let focusedInput = {name: newInputs.name, label: newInputs.label};
                                    let validationMessage = request.notSuccessMessage;
                                    this.setState({
                                        page: isValidated ? page + 1 : page,
                                        isValidated,
                                        validationMessage,
                                        focusedInput,
                                        makingRequest: false,
                                    });
                                } else {
                                    this.setState({
                                        makingRequest: false,
                                    }, this.nextPage(i + 1));
                                }
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    setFocusInput(focusedInput){
        this.setState({focusedInput});
    }

    /**
     * to check and to validate Input Fields
     */
    checkFields(startIndex = 0){
        const {contents} = this.props;
        const {page, entity} = this.state;
        if(entity instanceof CConnection) {
            if(page === 0){
                if(entity.title === ''){
                    this.setState({isValidated: true, validationMessage: '', hasRequired: true, focusedInput: {name: 'title', label: 'Title'}});
                    return false;
                }
                if(entity.fromConnector.id === 0){
                    this.setState({isValidated: true, validationMessage: '', hasRequired: true, focusedInput: {name: 'from_connector', label: 'From Connector'}});
                    return false;
                }
                if(entity.toConnector.id === 0){
                    this.setState({isValidated: true, validationMessage: '', hasRequired: true, focusedInput: {name: 'to_connector', label: 'To Connector'}});
                    return false;
                }
            }
            if(page === 1 && entity.template.mode === TEMPLATE_MODE && entity.template.templateId === -1){
                this.setState({isValidated: entity.allTemplates.length !== 0, validationMessage: entity.allTemplates.length !== 0 ? '' : 'Please, choose the expert mode', hasRequired: entity.allTemplates.length !== 0, focusedInput: {name: 'template', label: 'Template'}});
                return false;
            }
            return true;
        }
        if(entity instanceof CInvoker) {
            if(page === 0){
                if(entity.name === ''){
                    this.setState({isValidated: true, validationMessage: '', hasRequired: true, focusedInput: {name: 'name', label: 'Name'}});
                    return false;
                }
            }
            if(page === 1){
                if(entity.auth === ''){
                    this.setState({isValidated: true, validationMessage: '', hasRequired: true, focusedInput: {name: 'auth', label: 'Authentication'}});
                    return false;
                }
            }
            if(page === 2){
                if(entity.connection.name === ''){
                    this.setState({isValidated: true, validationMessage: '', hasRequired: true, focusedInput: {name: 'name', label: 'Name'}});
                    return false;
                }
                if(entity.connection.request.method === ''){
                    this.setState({isValidated: true, validationMessage: '', hasRequired: true, focusedInput: {name: 'method', label: 'Method'}});
                    return false;
                }
            }
            return true;
        }
        let inputs = contents[page].inputs;
        let hasRequired = false;
        let focusedInput = {name: '', label: ''};
        let validationMessage = '';
        let isValidated = true;
        for(let i = startIndex; i < inputs.length; i++){
            if(inputs[i].hasOwnProperty('required')){
                if(inputs[i].required) {
                    let tmpValue = entity[inputs[i].name];
                    if (tmpValue === ''
                        || (inputs[i].type === 'select+description' || inputs[i].type === 'select') && tmpValue === 0
                        || (inputs[i].type === 'connection_mode' && tmpValue && tmpValue.hasOwnProperty('mode') && tmpValue.mode === '')
                        || (inputs[i].type === 'connectors' || inputs[i].type === 'connectors_readonly') && (tmpValue.fromConnector === 0 || tmpValue.toConnector === 0)
                        || Array.isArray(tmpValue) && tmpValue.length === 0
                        || isEmptyObject(tmpValue)) {
                        hasRequired = true;
                        focusedInput.name = inputs[i].name;
                        focusedInput.label = inputs[i].label;
                        break;
                    }
                }
            }
            if(inputs[i].hasOwnProperty('check')){
                if(typeof inputs[i].check === 'function') {
                    let checkResult = inputs[i].check(entity);
                    if (!checkResult.value) {
                        isValidated = false;
                        if(checkResult.message === ''){
                            this.setState({isValidated, validationMessage: '', hasRequired});
                            return !hasRequired & isValidated;
                        }
                        focusedInput.name = inputs[i].name;
                        focusedInput.label = inputs[i].label;
                        validationMessage = checkResult.message;
                        break;
                    }
                }
            }
        }
        this.setState({isValidated, validationMessage, hasRequired, focusedInput});
        return !hasRequired & isValidated;
    }

    /**
     * to open next page
     * startFieldIndex - start to check fields from concrete index
     */
    nextPage(startFieldIndex = 0){
        const {contents, onPageSwitch} = this.props;
        const {page, contentsLength} = this.state;
        if(page < (contentsLength - 1)) {
            window.scrollTo(0,document.body.scrollHeight);
            if(this.checkFields( isNumber(startFieldIndex) ? startFieldIndex : 0)) {
                let content = contents[page + 1];
                if(content.hasOwnProperty('onPreEventStep')){
                    content.onPreEventStep();
                }
                this.setState({page: page + 1}, () => {
                    if(onPageSwitch){
                        onPageSwitch(page + 2);
                    }
                });
            }
        }
    }

    /**
     * to open previous page
     */
    prevPage(){
        const {contents, onPageSwitch} = this.props;
        const {page} = this.state;
        if(page > 0) {
            let content = contents[page - 1];
            if(content.hasOwnProperty('onPreEventStep')){
                content.onPreEventStep();
            }
            window.scrollTo(0, 0);
            this.setState({
                hasRequired: false,
                isValidated: true,
                validationMessage: '',
                page: page - 1
            }, () => {

                if(onPageSwitch){
                    onPageSwitch(page);
                }
            });
        }
    }

    /**
     * to open page from breadcrumbs
     */
    exactPage(page){
        if(page >= 0) {
            const {contents, onPageSwitch} = this.props;
            let content = contents[page];
            if(content.hasOwnProperty('onPreEventStep')){
                content.onPreEventStep();
            }
            window.scrollTo(0, 0);
            this.setState({
                hasRequired: false,
                isValidated: true,
                validationMessage: '',
                page,
            }, () => {

                if(onPageSwitch){
                    onPageSwitch(page + 1);
                }
            });
        }
    }

    /**
     * to update entity state
     */
    updateEntity(entity){
        const {initiateTestStatus} = this.props;

        if(initiateTestStatus !== null){
            initiateTestStatus();
        }
        this.setState({
            entity,
            focusedInput: {name: '', label: ''},
        });
    }

    /**
     * to do action of the entity (add or update)
     */
    doAction(){
        window.scrollTo(0,document.body.scrollHeight);
        if(this.checkFields()) {
            const {action} = this.props;
            action(this.state.entity);
        }
    }

    renderValidationMessage(){
        const {hasRequired, focusedInput, isValidated, validationMessage} = this.state;
        const {authUser} = this.props;
        if(hasRequired && focusedInput.label){
            return <ValidationMessage message={`${focusedInput.label} is a required field`} authUser={authUser}/>;
        }
        if(!isValidated){
            return <ValidationMessage message={validationMessage} authUser={authUser}/>;
        }
        return null;
    }

    render(){
        const {breadcrumbsItems, contents, translations, type, isActionInProcess, noBreadcrumbs, noHint, noNavigation, authUser} = this.props;
        const {page, focusedInput, contentsLength} = this.state;
        let navigationPage = {
            page,
            lastPage: contentsLength - 1,
            prevPage: ::this.prevPage,
            nextPage: ::this.nextPage,
        };
        return (
            <div>
                <Breadcrumbs items={breadcrumbsItems} page={page} exactPage={::this.exactPage} authUser={authUser}/>
                {
                    noHint
                        ?
                        null
                        :
                        <Hint hint={contents[page].hint} authUser={authUser}/>
                }
                <Form
                    inputs={contents[page].inputs}
                    entity={this.state.entity}
                    updateEntity={::this.updateEntity}
                    focusedInput={focusedInput.name}
                    authUser={authUser}
                    setFocusInput={::this.setFocusInput}
                />
                {this.renderValidationMessage()}
                {
                    noNavigation
                    ?
                        null
                    :
                        <Navigation
                            navigationPage={navigationPage}
                            action={::this.doAction}
                            translations={translations}
                            type={type}
                            isActionInProcess={isActionInProcess}
                            test={contents[page].hasOwnProperty('test') ? contents[page].test : {
                                isTested: 1,
                                callback: null
                            }}
                            entity={this.state.entity}
                            authUser={authUser}
                            makingRequest={this.state.makingRequest}
                        />
                }
            </div>
        );
    }
}

ChangeContent.propTypes = {
    breadcrumbsItems: PropTypes.array,
    contents: PropTypes.array.isRequired,
    translations: PropTypes.object.isRequired,
    action: PropTypes.func,
    entity: PropTypes.object,
    type: PropTypes.string,
    isActionInProcess: PropTypes.number,
    initiateTestStatus: PropTypes.func,
    noNavigation: PropTypes.bool,
    noHint: PropTypes.bool,
    noBreadcrumbs: PropTypes.bool,
    authUser: PropTypes.object.isRequired,
};

ChangeContent.defaultProps = {
    breadcrumbsItems: [],
    entity: {},
    type: 'add',
    isActionInProcess: API_REQUEST_STATE.INITIAL,
    initiateTestStatus: null,
    noNavigation: false,
    noHint: false,
    noBreadcrumbs: false,
};

export default ChangeContent;