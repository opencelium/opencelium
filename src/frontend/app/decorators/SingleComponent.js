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

import {capitalize, consoleLog, isEmptyObject} from '@utils/app';
import {API_REQUEST_STATE} from "@utils/constants/app";


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

            doAction(entity){
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
                let checkEntity = this.checkEntity();
                if(checkEntity !== null){
                    return checkEntity;
                }
                return <Component {...this.props} doAction={::this.doAction}/>;
            }
        };
    };
}
