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

import React, { Component } from 'react';
import RejectedRequest from "@components/general/app/RejectedRequest";
import Loading from "@loading";
import PageNotFound from "@components/general/app/PageNotFound";

import {capitalize, consoleLog, isEmptyObject, setFocusById} from '@utils/app';
import {API_REQUEST_STATE} from "@utils/constants/app";
import {automaticallyShowTour} from "@utils/constants/tours";


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
                };
            }

            static getDerivedStateFromProps(props, state) {
                let {entity, isCommandTriggered, resources, fetchingResource, hasStartedFetchingEntity, hasStartedTriggeringCommand, hasStartedFetchingResources} = state;
                let hasUpdate = false;
                if(command !== 'adding' && props[`fetching${capitalize(singleEntityName)}`] === API_REQUEST_STATE.FINISH && hasStartedFetchingEntity){
                    entity = props[singleEntityName];
                    hasUpdate = true;
                }
                if(props[command + capitalize(singleEntityName)] === API_REQUEST_STATE.FINISH && hasStartedTriggeringCommand){
                    isCommandTriggered = true;
                    hasUpdate = true;
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
                if(command !== 'adding') {
                    this.fetch();
                }
                if(additionalResources.length > 0) {
                    this.fetchResource();
                }
            }

            componentDidUpdate(){
                const {entity, resources, fetchingResource, hasStartedFetchingEntity, hasWrongURL} = this.state;
                if(entity === null && command !== 'adding' && !hasStartedFetchingEntity && !hasWrongURL) {
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
                if(command !== 'adding') {
                    let id = -1;
                    if (this.props.params) {
                        if (this.props.params.hasOwnProperty('id')) {
                            id = singleEntityName !== 'invoker' ? parseInt(this.props.params.id) : this.props.params.id;
                        } else {
                            if (this.props.hasOwnProperty('authUser')) {
                                id = singleEntityName !== 'invoker' ? parseInt(this.props.authUser.userId) : this.props.authUser.userId;
                            }
                        }
                    }
                    if (typeof id === 'number' && id > 0 || singleEntityName === 'invoker') {
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
                const {entity, isCommandTriggered, resources, hasWrongURL} = this.state;
                const {error, t, authUser} = this.props;
                const cancelFetching = this.props[`fetch${capitalize(singleEntityName)}Canceled`];
                if(hasWrongURL){
                    return <PageNotFound/>;
                }
                if(this.props[`fetching${capitalize(singleEntityName)}`] === API_REQUEST_STATE.ERROR){
                    return <RejectedRequest entityName={singleEntityName} error={error}/>;
                }
                if(resources.length < additionalResources.length && this.props[`fetching${capitalize(additionalResources[resources.length])}`] === API_REQUEST_STATE.ERROR){
                    return <RejectedRequest entityName={additionalResources[resources.length]} error={error}/>;
                }
                if(entity === null && command !== 'adding' || resources.length !== additionalResources.length) {
                    return <Loading cancelCallback={cancelFetching} authUser={authUser}/>;
                }
                if(typeof entity !== 'object' || isEmptyObject(entity)) {
                    if(command !== 'adding') {
                        return <PageNotFound/>;
                    }
                }
                if(command !== '' && isCommandTriggered){
                    if(typeof this.redirect === 'function')
                        this.redirect();
                }

                return null;
            }

            doAction(entity, thisComponentScope = null){
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
                        thisComponentScope.setState({
                            validationMessages: {...validationMessages, ...validations},
                            entity: Object.assign({}, typeof entity.getObject === 'function' ? entity.getObject() : entity),
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

            action(entity){
                this.setState({hasStartedTriggeringCommand: true});
                let actionName = '';
                switch(command){
                    case 'adding':
                        actionName = 'add';
                        break;
                    case 'updating':
                        actionName = 'update';
                        break;
                }
                if(actionName !== '') {
                    let action = `${actionName}${capitalize(singleEntityName)}`;
                    if(this.props.hasOwnProperty(action)) {
                        if(mapping !== null) {
                            this.props[action](mapping(entity));
                        } else{
                            this.props[action](entity);
                        }
                    } else{
                        consoleLog(`There is not action %c${action} for %c${singleEntityName}`, "font-weight: bold;", "font-weight: bold;");
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
                    doAction={::this.doAction}
                    checkValidationRequest={::this.checkValidationRequest}
                    setValidationMessage={::this.setValidationMessage}
                    isTourOpen={isTourOpen}
                    openTour={::this.openTour}
                    closeTour={::this.closeTour}
                />;
            }
        };
    };
}
