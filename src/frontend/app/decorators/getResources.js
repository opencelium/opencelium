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

import {capitalize, consoleLog, isArray} from '@utils/app';
import {API_REQUEST_STATE} from "@utils/constants/app";
import {connect} from "react-redux";
import {getAllActions} from "@utils/all_actions";


/**
 * common component for fetching resources
 *
 * @param resourceNames - the plural name of the resources that should be fetched
 * @param settings - {isBackground - fetching without notifications}
 * @returns the same component with additional functionalities
 * @constructor
 */
export default function getResources(resourceNames = [], settings = {isBackground: false}){
    return function (Component) {
        if(!isArray(resourceNames)){
            resourceNames = [resourceNames];
        }
        function mapStateToProps(state){
            let props = {};
            for(let i = 0; i < resourceNames.length; i++){
                const entity = state.get(resourceNames[i]);
                props[resourceNames[i]] = entity.get(resourceNames[i]).toJS();
                props[`fetching${capitalize(resourceNames[i])}`] = entity.get(`fetching${capitalize(resourceNames[i])}`);
            }
            return props;
        }

        return (
            @connect(mapStateToProps, getAllActions())
            class C extends React.Component {
                constructor(props){
                    super(props);
                    this.state = {
                        resourcesLength: 0,
                        resourceErrorName: '',
                    };
                }

                componentDidMount(){
                    for(let i = 0; i < resourceNames.length; i++){
                        const fetchFunctionName = `fetch${capitalize((resourceNames[i]))}`;
                        if(this.props.hasOwnProperty(fetchFunctionName)){
                            this.props[fetchFunctionName]({background: settings.isBackground});
                        } else{
                            consoleLog(`${fetchFunctionName} function is absent`);
                        }
                    }
                }

                componentDidUpdate(){
                    let resourcesLength = 0;
                    let resourceErrorName = '';
                    if(this.state.resourcesLength !== -1 && this.state.resourcesLength < resourceNames.length) {
                        for (let i = 0; i < resourceNames.length; i++) {
                            const stateName = `fetching${capitalize(resourceNames[i])}`;
                            if (typeof this.props[stateName] !== 'undefined') {
                                if (this.props[stateName] === API_REQUEST_STATE.FINISH) {
                                    resourcesLength++;
                                }
                                if (this.props[stateName] === API_REQUEST_STATE.ERROR) {
                                    resourceErrorName = stateName;
                                    resourcesLength = -1;
                                    break;
                                }
                            } else {
                                consoleLog(`${stateName} state is absent`);
                            }
                        }
                        if(resourcesLength !== this.state.resourcesLength){
                            this.setState({
                                resourcesLength,
                                resourceErrorName,
                            })
                        }
                    }
                }

                componentWillUnmount(){
                    for(let i = 0; i < resourceNames.length; i++) {
                        const cancelFunctionName = `fetch${capitalize(resourceNames[i])}Canceled`;
                        if (this.props[cancelFunctionName] === API_REQUEST_STATE.START) {
                            if (typeof this.props[cancelFunctionName] === 'function') {
                                this.props[cancelFunctionName]();
                            } else {
                                consoleLog(`${cancelFunctionName} function is absent`);
                            }
                        }
                    }
                }

                render(){
                    const {resourcesLength, resourceErrorName} = this.state;
                    if(resourcesLength === -1)
                        return <RejectedRequest entityName={resourceErrorName}/>;
                    if(resourcesLength < resourceNames.length)
                        return <Loading/>;
                    return <Component {...this.props}/>;
                }
            }
        );
    };
}

