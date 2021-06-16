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
import Breadcrumbs from "./Breadcrumbs";
import Form from "./Form";
import Hint from "./Hint";
import Navigation from "./Navigation";
import {isNumber, setFocusById} from "@utils/app";
import ValidationMessage from "./ValidationMessage";
import {
    addChangeContentActionNavigation, addFocusDocumentNavigation,
    addNextPageChangeEntityKeyNavigation,
    addPrevPageChangeEntityKeyNavigation, removeChangeContentActionNavigation, removeFocusDocumentNavigation,
    removeNextPageChangeEntityKeyNavigation,
    removePrevPageChangeEntityKeyNavigation
} from "@utils/key_navigation";

import {isEmptyObject} from '@utils/app';
import {API_REQUEST_STATE} from "@utils/constants/app";
import {setComponentInChangeContent} from "@actions/app";


function mapStateToProps(state){
    const app = state.get('app');
    return {
        isComponentExternalInChangeContent: app.get('isComponentExternalInChangeContent'),
    };
}

/**
 * Change Content Component
 */
@connect(mapStateToProps, {setComponentInChangeContent})
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
            entity = this.getInputsState(onlyInputs);
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
        //addChangeContentActionNavigation(this);
        addFocusDocumentNavigation(this);
        this.applyExternalComponentSettings();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.applyExternalComponentSettings();
    }

    applyExternalComponentSettings(){
        const {page} = this.state;
        const {contents, isComponentExternalInChangeContent} = this.props;
        const isExternalComponent = contents[page].hasOwnProperty('isExternalComponent') ? contents[page].isExternalComponent : false;
        if(isExternalComponent){
            if(!isComponentExternalInChangeContent) {
                this.props.setComponentInChangeContent(true);
            }
        } else{
            if(isComponentExternalInChangeContent) {
                this.props.setComponentInChangeContent(false);
            }
        }
    }

    componentWillUnmount(){
        removePrevPageChangeEntityKeyNavigation(this);
        removeNextPageChangeEntityKeyNavigation(this);
        //removeChangeContentActionNavigation(this);
        removeFocusDocumentNavigation(this);
    }

    UNSAFE_componentWillReceiveProps (nextProps){
        const {page, contentsLength} = this.state;
        if(this.state.page < (contentsLength - 1)) {
            let contents = nextProps.contents[this.state.page];
            for (let i = 0; i < contents.inputs.length; i++) {
                let newInputs = contents.inputs[i];
                if (newInputs.hasOwnProperty('request')) {
                    let request = newInputs.request;
                    if (request) {
                        if (request.inProcess) {
                            this.setState({makingRequest: true});
                        } else {
                            if (request && request.status === true) {
                                if (request.result && (request.hasOwnProperty('failCondition') ? request.failCondition(request.result) : request.result.message === "EXISTS")) {
                                    let isValidated = false;
                                    let focusedInput = {name: newInputs.name, label: newInputs.label};
                                    let validationMessage = request.notSuccessMessage;
                                    setFocusById(`input_${newInputs.name}`);
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

    /**
     * to get values from inputs
     *
     * @param inputs - inputs from props.contents
     */
    getInputsState(inputs){
        let obj = {};
        if(Array.isArray(inputs)) {
            inputs.forEach(input => input.hasOwnProperty('defaultValue') ? obj[input.name] = input.defaultValue : obj[input.name] = '');
        }
        return obj;
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
        let inputs = contents[page].inputs;
        let hasRequired = false;
        let focusedInput = {name: '', label: ''};
        let validationMessage = '';
        let isValidated = true;
        for(let i = startIndex; i < inputs.length; i++){
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
     * to focus on the first input when switch the page
     */
    setFocusOnInput(inputs){
        if(inputs.length > 0) {
            if (inputs[0].readOnly === true) {
                return;
            }
            let name = inputs[0].name;
            if (inputs[0].hasOwnProperty('visible')) {
                let elem = inputs.find(i => i.visible === true);
                if (elem) {
                    name = elem.name;
                }
            }
            setFocusById(`input_${name}`);
        }
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
                    ::this.setFocusOnInput(content.inputs);
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
                ::this.setFocusOnInput(content.inputs);
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
                ::this.setFocusOnInput(content.inputs);
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
     * to clear a validation message
     */
    clearValidationMessage(){
        if(this.state.name !== '' && this.state.label !== '') {
            this.setState({
                focusedInput: {name: '', label: ''},
            });
        }
    }

    /**
     * to do action of the entity (add or update)
     */
    doAction(){
        window.scrollTo(0,document.body.scrollHeight);
        if(this.checkFields()) {
            if(!::this.test()) {
                const {action} = this.props;
                action(this.state.entity);
            }
        }
    }

    getTestData(){
        const {page} = this.state;
        const {contents} = this.props;
        return contents[page].hasOwnProperty('test') ? contents[page].test : {
            isTested: 1,
            callback: null
        };
    }

    /**
     * to test Connector
     */
    test(){
        const {entity} = this.state;
        const testData = this.getTestData();
        if(testData.isTested === -1 || testData.isTested === 0) {
            testData.callback(entity);
            return true;
        }
        return false;
    }

    renderValidationMessage(validationMessageProps = {}){
        const {hasRequired, focusedInput, isValidated, validationMessage} = this.state;
        const {authUser} = this.props;
        if(hasRequired && focusedInput.label){
            return <ValidationMessage message={`${focusedInput.label} is a required field`} authUser={authUser} {...validationMessageProps}/>;
        }
        if(!isValidated && focusedInput.label){
            return <ValidationMessage message={validationMessage} authUser={authUser} {...validationMessageProps}/>;
        }
        return null;
    }

    renderNavigation(navigationProps = {}){
        const {contents, translations, type, isActionInProcess, authUser} = this.props;
        const {page, contentsLength} = this.state;
        let navigationPage = {
            page,
            lastPage: contentsLength - 1,
            prevPage: ::this.prevPage,
            nextPage: ::this.nextPage,
        };
        const test = ::this.getTestData();
        const {extraAction} = contents[page];
        return(
            <Navigation
                navigationPage={navigationPage}
                action={::this.doAction}
                translations={translations}
                type={type}
                isActionInProcess={isActionInProcess}
                isTested={test.isTested}
                entity={this.state.entity}
                authUser={authUser}
                makingRequest={this.state.makingRequest}
                extraAction={extraAction}
                {...navigationProps}
            />
        );
    }

    render(){
        const {breadcrumbsItems, contents, noHint, noNavigation, authUser, isComponentExternalInChangeContent} = this.props;
        const {page, focusedInput} = this.state;
        const inputs = contents[page].inputs;
        if(isComponentExternalInChangeContent){
            return (
                <Form
                    clearValidationMessage={::this.clearValidationMessage}
                    inputs={inputs}
                    entity={this.state.entity}
                    updateEntity={::this.updateEntity}
                    focusedInput={focusedInput.name}
                    authUser={authUser}
                    setFocusInput={::this.setFocusInput}
                    renderNavigationComponent={::this.renderNavigation}
                    renderValidationMessage={::this.renderValidationMessage}
                />
            );
        }
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
                    clearValidationMessage={::this.clearValidationMessage}
                    inputs={inputs}
                    entity={this.state.entity}
                    updateEntity={::this.updateEntity}
                    focusedInput={focusedInput.name}
                    authUser={authUser}
                    setFocusInput={::this.setFocusInput}
                    renderNavigationComponent={::this.renderNavigation}
                    renderValidationMessage={::this.renderValidationMessage}
                />
                {this.renderValidationMessage()}
                {
                    noNavigation
                    ?
                        null
                    :
                        this.renderNavigation()
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
    extraAction: '',
};

export default ChangeContent;