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

import React, { Component } from 'react';
import CanceledRequest from "../components/general/app/CanceledRequest";
import RejectedRequest from "../components/general/app/RejectedRequest";
import Loading from "../components/general/app/Loading";
import PageNotFound from "../components/general/app/PageNotFound";
import {entitiesProPage} from '../components/general/basic_components/pagination/Pagination';

import {capitalize, consoleLog} from '../utils/app';
import {API_REQUEST_STATE} from "../utils/constants/app";


/**
 * common component for fetching a list of data
 *
 * @param pluralEntityName - the plural name of the entity that should be fetched
 * @returns the same component with additional functionalities
 * @constructor
 */
export function ListComponent(pluralEntityName){
    return function (Component) {
        return class extends Component{
            constructor(props){
                super(props);
                this.totalPages = 1;
                this.state = {
                    hasStartedFetchingEntities: false,
                    entities: null,
                };
            }

            static getDerivedStateFromProps(props, state) {
                let {entities, hasStartedFetchingEntities} = state;
                let hasUpdate = false;
                if(props[`fetching${capitalize(pluralEntityName)}`] === API_REQUEST_STATE.FINISH && hasStartedFetchingEntities){
                    entities = props[pluralEntityName];
                    hasUpdate = true;
                }
                if(hasUpdate){
                    return {
                        entities,
                        hasStartedFetchingEntities: false,
                    };
                }
                return null;
            }

            componentDidMount(){
                this.fetch();
            }

            componentWillUnmount(){
                if(this.props[`fetching${capitalize(pluralEntityName)}`] === API_REQUEST_STATE.START){
                    if(typeof this.props['fetch' + capitalize(pluralEntityName) + 'Canceled'] === 'function') {
                        this.props['fetch' + capitalize(pluralEntityName) + 'Canceled']();
                    } else{
                        consoleLog(this.props);
                    }
                }
            }

            /**
             * fetching entities
             */
            fetch(){
                let fetchName = 'fetch' + capitalize(pluralEntityName);
                if(this.props.hasOwnProperty(fetchName)) {
                    this.setState({hasStartedFetchingEntities: true});
                    this.props[fetchName]();
                } else{
                    consoleLog('The fetching function is absent');
                }
            }

            setTotalPages(total){
                this.totalPages = total;
            }

            /**
             * important function for rendering component
             *
             * @returns
             *      CanceledRequest if the request was canceled
             *      RejectedRequest if the request was rejected
             *      Loading if the fetching is in process
             *      PageNotFound if the requested page does not exist
             */
            checkEntity(){
                const {entities} = this.state;
                const {params, authUser} = this.props;
                const cancelFetching = this.props['fetch' + capitalize(pluralEntityName) + 'Canceled'];
/*                if(this.props[`fetching${capitalize(pluralEntityName)}`] === API_REQUEST_STATE.PAUSE)
                    return <CanceledRequest/>;*/

                if(this.props[`fetching${capitalize(pluralEntityName)}`] === API_REQUEST_STATE.ERROR)
                    return <RejectedRequest entityName={pluralEntityName}/>;

                if(entities === null)
                    return <Loading cancelCallback={cancelFetching} authUser={authUser}/>;

                if(params.pageNumber > this.totalPages && this.totalPages > 0){
                    if(params.pageNumber - 1 !== this.totalPages){
                        return <PageNotFound/>;
                    }
                }

                return null;
            }

            render(){
                let checkEntity = this.checkEntity();
                if(checkEntity !== null){
                    return checkEntity;
                }
                return <Component
                    {...this.props}
                    setTotalPages={::this.setTotalPages}
                />;
            }
        };
    };
}

