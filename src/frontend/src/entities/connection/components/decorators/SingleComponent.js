/*
 *  Copyright (C) <2023>  <becon GmbH>
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

import React, { Component } from 'react';
import Loading from "@loading";

import {capitalize, consoleLog, isEmptyObject, isString, setFocusById} from '@application/utils/utils';
import {automaticallyShowTour} from "@entity/connection/components/utils/constants/tours";
import {PageNotFound} from "@page/page_not_found/PageNotFound";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";


/**
 * common component for fetching single data
 *
 * @param singleEntityName - the single name of the entity that should be triggered
 * @param command - fetching or updating
 * @param additionalResources - fetching additional data
 * @param mapping - map entity before action
 * returns the same component
 * @constructor
 */
    export function SingleComponent(singleEntityName, command = '', additionalResources = [], mapping = null){
    return function (Component){
        return class extends Component{
            constructor(props){
                super(props);

                this.state = {
                    entity: null,
                    isCommandTriggered: false,
                    resources: [],
                    fetchingResource: false,
                    hasStartedFetchingEntity: false,
                    hasStartedTriggeringCommand: false,
                    hasStartedFetchingResources: false,
                    hasWrongURL: false,
                    isTourOpen: automaticallyShowTour(props.authUser),
                    redirectUrl: '',
                };
            }

            static getDerivedStateFromProps(props, state) {
                let {entity, isCommandTriggered, resources, fetchingResource, hasStartedFetchingEntity, hasStartedTriggeringCommand, hasStartedFetchingResources} = state;
                let hasUpdate = false;
                if(singleEntityName !== ''){
                    if(command !== 'adding' && props[`fetching${capitalize(singleEntityName)}`] === API_REQUEST_STATE.FINISH && hasStartedFetchingEntity){
                        entity = props[singleEntityName];
                        hasUpdate = true;
                    }
                    if(props[command + capitalize(singleEntityName)] === API_REQUEST_STATE.FINISH && hasStartedTriggeringCommand){
                        isCommandTriggered = true;
                        hasUpdate = true;
                    }
                }
                if(additionalResources.length !== 0 && resources.length < additionalResources.length && hasStartedFetchingResources){
                    let currentResourceName = additionalResources[resources.length];
                    if(props[`fetching${capitalize(currentResourceName)}`] === API_REQUEST_STATE.FINISH){
                        resources.push(currentResourceName);
                        fetchingResource = false;
                        hasUpdate = true;
                    }
                }
                if(hasUpdate){
                    return {
                        entity,
                        isCommandTriggered,
                        resources,
                        fetchingResource,
                    };
                }
                return null;
            }

            componentDidMount(){
                if(command !== 'adding' && singleEntityName !== '') {
                    this.fetch();
                }
                if(additionalResources.length > 0) {
                    this.fetchResource();
                }
            }

            componentDidUpdate(){
                const {entity, resources, fetchingResource, hasStartedFetchingEntity, hasWrongURL} = this.state;
                if(entity === null && singleEntityName !== '' && command !== 'adding' && !hasStartedFetchingEntity && !hasWrongURL) {
                    this.fetch();
                }
                if(additionalResources.length > 0) {
                    if (resources.length !== additionalResources.length && !fetchingResource) {
                        this.fetchResource();
                    }
                }
            }

            /**
             * to close current Tour
             */
            closeTour(){
                this.setState({
                    isTourOpen: false,
                });
            }

            /**
             * to open current Tour
             */
            openTour(){
                this.setState({
                    isTourOpen: true,
                });
            }

            checkValidationRequest(thisComponentScope, propertyName, propertyWasChecked, checkingResult, validationMessage){
                if(thisComponentScope.startDoingAction && propertyWasChecked){
                    if(checkingResult){
                        if(checkingResult.message === 'EXISTS') {
                            thisComponentScope.setState({
                                validationMessages: {
                                    ...thisComponentScope.state.validationMessages,
                                    [propertyName]: validationMessage
                                }
                            });
                            setFocusById(`input_${propertyName}`)
                            thisComponentScope.startDoingAction = false;
                        } else{
                            let isFreeToDoAction = true;
                            for(let param in thisComponentScope.state.validationMessages){
                                if(thisComponentScope.state.validationMessages[param] !== ''){
                                    setFocusById(`input_${param}`);
                                    isFreeToDoAction = false;
                                    break;
                                }
                            }
                            if(isFreeToDoAction){
                                this.doAction(thisComponentScope.state.entity);
                            }
                            thisComponentScope.startDoingAction = false;
                        }
                    }
                }
            }

            setValidationMessage(thisComponentScope, name, value){
                if(thisComponentScope.state.validationMessages.hasOwnProperty(name)) {
                    thisComponentScope.setState({
                        validationMessages: {
                            ...thisComponentScope.state.validationMessages,
                            [name]: value,
                        }
                    })
                }
            }

            /**
             * fetch entity
             */
            fetch(){
                if(command !== 'adding' && singleEntityName !== '') {
                    let id = -1;
                    if (this.props.params) {
                        if (this.props.params.hasOwnProperty('id')) {
                            id = singleEntityName !== 'invoker' && singleEntityName !== 'template' ? parseInt(this.props.params.id) : this.props.params.id;
                        } else {
                            if (this.props.hasOwnProperty('authUser')) {
                                id = singleEntityName !== 'invoker' && singleEntityName !== 'template' ? parseInt(this.props.authUser.userId) : this.props.authUser.userId;
                            }
                        }
                    }
                    if (typeof id === 'number' && id > 0 || singleEntityName === 'invoker' || singleEntityName === 'template') {
                        this.setState({hasStartedFetchingEntity: true});
                        this.props[`fetch${capitalize(singleEntityName)}`]({id});
                    } else {
                        this.setState({hasWrongURL: true});
                    }
                }
            }

            fetchResource(){
                const {resources, fetchingResource} = this.state;
                if(resources.length < additionalResources.length) {
                    this.props[`fetch${capitalize(additionalResources[resources.length])}`]({background: true});
                    if(!fetchingResource) {
                        this.setState({fetchingResource: true, hasStartedFetchingResources: true});
                    } else{
                        this.setState({hasStartedFetchingResources: true});
                    }
                }
            }

            /**
             * important function for rendering component
             *
             * @returns
             *      RejectedRequest if the request was rejected
             *      Loading if the fetching is in process
             *      PageNotFound if the requested page does not exist
             */
            checkEntity(){
                const {entity, isCommandTriggered, resources, hasWrongURL, redirectUrl} = this.state;
                const {error, t, authUser, router} = this.props;
                const cancelFetching = singleEntityName !== '' ? this.props[`fetch${capitalize(singleEntityName)}Canceled`] : '';
                if(hasWrongURL){
                    return <PageNotFound/>;
                }
                if((entity === null && singleEntityName !== '' && command !== 'adding') || resources.length !== additionalResources.length) {
                    return <Loading cancelCallback={cancelFetching} authUser={authUser}/>;
                }
                if(typeof entity !== 'object' || isEmptyObject(entity)) {
                    if(command !== 'adding' && singleEntityName !== '') {
                        return <PageNotFound/>;
                    }
                }
                if(singleEntityName !== '' && isCommandTriggered){
                    if(redirectUrl !== ''){
                        router.push(redirectUrl)
                    } else{
                        if(typeof this.redirect === 'function'){
                            this.redirect();
                        }
                    }
                }

                return null;
            }

            do(entity, thisComponentScope = null){
                if(thisComponentScope !== null){
                    const {validationMessages} = thisComponentScope.state;
                    thisComponentScope.startDoingAction = true;
                    let validationNames = Object.keys(validationMessages);
                    let isValidationPassed = true;
                    let validations = {};
                    let firstValidationName = '';
                    for(let i = 0; i < validationNames.length; i++){
                        if(typeof thisComponentScope[`validate${capitalize(validationNames[i])}`] === 'function') {
                            const result = thisComponentScope[`validate${capitalize(validationNames[i])}`](entity);
                            if (!result.value) {
                                validations[validationNames[i]] = result.message;
                                if (isValidationPassed) {
                                    isValidationPassed = false;
                                    firstValidationName = validationNames[i];
                                }
                            } else {
                                validations[validationNames[i]] = '';
                            }
                        }
                    }
                    if(isValidationPassed){
                        this.action(entity);
                        thisComponentScope.startDoingAction = false;
                    } else{
                        const convertedObject = typeof entity.getObjectForBackend === 'function' ? entity.getObjectForBackend() : typeof entity.getObject === 'function' ? entity.getObject() : entity;
                        thisComponentScope.setState({
                            validationMessages: {...validationMessages, ...validations},
                            entity: Object.assign({}, convertedObject),
                        });
                        if(firstValidationName !== ''){
                            if(validations[firstValidationName] !== '') {
                                setFocusById(`input_${firstValidationName}`);
                            }
                        }
                    }
                } else{
                    this.action(entity);
                }
            }

            doAction(entity, thisComponentScope = null, redirectUrl = ''){
                if(isString(redirectUrl) && redirectUrl){
                    this.setState({
                        redirectUrl,
                    }, () => this.do(entity, thisComponentScope));
                } else{
                    this.do(entity, thisComponentScope);
                }
            }

            action(entity){
                if(singleEntityName !== '') {
                    this.setState({hasStartedTriggeringCommand: true});
                    let actionName = '';
                    switch (command) {
                        case 'adding':
                            actionName = 'add';
                            break;
                        case 'updating':
                            actionName = 'update';
                            break;
                    }
                    if (actionName !== '') {
                        let action = `${actionName}${capitalize(singleEntityName)}`;
                        if (this.props.hasOwnProperty(action)) {
                            if (mapping !== null) {
                                this.props[action](mapping(entity, this));
                            } else {
                                this.props[action](entity);
                            }
                        } else {
                            consoleLog(`There is not action %c${action} for %c${singleEntityName}`, "font-weight: bold;", "font-weight: bold;");
                        }
                    }
                }
            }

            render(){
                const {isTourOpen} = this.state;
                let checkEntity = this.checkEntity();
                if(checkEntity !== null){
                    return checkEntity;
                }
                return <Component
                    {...this.props}
                    doAction={(entity, thisComponentScope = null, redirectUrl = '') => this.doAction(entity, thisComponentScope, redirectUrl)}
                    checkValidationRequest={(a, b, c, d, e) => this.checkValidationRequest(a, b, c, d, e)}
                    setValidationMessage={(a, b, c) => this.setValidationMessage(a, b, c)}
                    isTourOpen={isTourOpen}
                />;
            }
        };
    };
}
