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

import {capitalize} from "@application/utils/utils";

export class CSearch{
    searchValue = '';
    componentName = '';
    sources = {};

    constructor(searchData) {
        this.searchValue = searchData?.searchValue.toLowerCase().trim() || '';
        this.componentName = searchData?.componentName || '';
        this.sources = searchData?.sources || {};
    }

    getResults(){
        let result = {};
        if(this.componentName !== ''){
            result = this[`searchIn${capitalize(this.componentName)}`]();
        } else{
            for(let searchName in this){
                if(searchName.substr(0, 8) === 'searchIn'){
                    result = {...result, ...this[searchName]()};
                }
            }
        }
        return result;
    }

    search(componentName, searchFunction){
        const source = this.sources[componentName];
        let result = [];
        if(source){
            result = source.filter((value) => searchFunction(value, this.searchValue));
        }
        return {[componentName]: result};
    }

    /**
     * search in connectors by name, description, invoker.name
     * @returns {{}}
     */
    searchInConnectors(){
        const searchFunction = (element, searchValue)=>{
            let checkName = element.name ? element.name.toLowerCase().indexOf(searchValue) !== -1 : false;
            let checkTitle = element.title ? element.title.toLowerCase().indexOf(searchValue) !== -1 : false;
            let checkDescription = element.description ? element.description.toLowerCase().indexOf(searchValue) !== -1 : false;
            let checkInvokerName = element.invoker && element.invoker.name ? element.invoker.name.toLowerCase().indexOf(searchValue) !== -1 : false;
            return checkName || checkTitle || checkDescription || checkInvokerName;
        }
        return this.search('connectors', searchFunction);
    }

    /**
     * search in connections by title, description, connector.title
     * @returns {{}}
     */
    searchInConnections(){
        const searchFunction = (element, searchValue)=>{
            let checkTitle = element.title ? element.title.toLowerCase().indexOf(searchValue) !== -1 : false;
            let checkDescription = element.description ? element.description.toLowerCase().indexOf(searchValue) !== -1 : false;
            let checkFromConnectorTitle = element.fromConnector && element.fromConnector.title ? element.fromConnector.title.toLowerCase().indexOf(searchValue) !== -1 : false;
            let checkToConnectorTitle = element.toConnector && element.toConnector.title ? element.toConnector.title.toLowerCase().indexOf(searchValue) !== -1 : false;
            return checkTitle || checkDescription || checkFromConnectorTitle || checkToConnectorTitle;
        }
        return this.search('connections', searchFunction);
    }

    /**
     * search in schedules by title, connection.title
     * @returns {{}}
     */
    searchInSchedules(){
        const searchFunction = (element, searchValue)=>{
            let checkTitle = element.title ? element.title.toLowerCase().indexOf(searchValue) !== -1 : false;
            let checkConnectionTitle = element.connection && element.connection.title ? element.connection.title.toLowerCase().indexOf(searchValue) !== -1 : false;
            return checkTitle || checkConnectionTitle;
        }
        return this.search('schedules', searchFunction);
    }

    /**
     * search in users by email, userGroup.name
     * @returns {{}}
     */
    searchInUsers(){
        const searchFunction = (element, searchValue)=>{
            let checkEmail = element.email ? element.email.toLowerCase().indexOf(searchValue) !== -1 : false;
            let checkGroupName = element.userGroups && element.userGroups.name ? element.userGroups.name.toLowerCase().indexOf(searchValue) !== -1 : false;
            return checkEmail || checkGroupName;
        }
        return this.search('users', searchFunction);
    }

    /**
     * search in userGroups by name, description, component.name
     * @returns {{}}
     */
    searchInUserGroups(){
        const searchFunction = (element, searchValue)=>{
            const components = element.components ? element.components.map(e => e.name).join(', ') : '';
            let checkName = element.role ? element.role.toLowerCase().indexOf(searchValue) !== -1 : false;
            let checkDescription = element.description ? element.description.toLowerCase().indexOf(searchValue) !== -1 : false;
            let checkComponents = components ? components.toLowerCase().indexOf(searchValue) !== -1 : false;
            return checkName || checkDescription || checkComponents;
        }
        return this.search('userGroups', searchFunction);
    }

    searchInInvokers(){
        const searchFunction = (element, searchValue)=>{
            let checkName = element.name ? element.name.toLowerCase().indexOf(searchValue) !== -1 : false;
            let checkDescription = element.description ? element.description.toLowerCase().indexOf(searchValue) !== -1 : false;
            let checkAuthType = element.authType ? element.authType.toLowerCase().indexOf(searchValue) !== -1 : false;
            const operations = element.operations ? element.operations.map(e => e.name).join(', ') : '';
            let checkOperations = operations ? operations.toLowerCase().indexOf(searchValue) !== -1 : false;
            return checkName || checkDescription || checkAuthType || checkOperations;
        }
        return this.search('invokers', searchFunction);
    }

    searchInTemplates(){
        const searchFunction = (element, searchValue)=>{
            let checkName = element.name ? element.name.toLowerCase().indexOf(searchValue) !== -1 : false;
            let checkDescription = element.description ? element.description.toLowerCase().indexOf(searchValue) !== -1 : false;
            let checkFromInvokerName = element?.connection?.fromConnector?.invoker?.name ? element.connection.fromConnector.invoker.name.toLowerCase().indexOf(searchValue) !== -1 : false;
            let checkToInvokerName = element?.connection?.toConnector?.invoker?.name ? element.connection.toConnector.invoker.name.toLowerCase().indexOf(searchValue) !== -1 : false;
            return checkName || checkDescription || checkFromInvokerName || checkToInvokerName;
        }
        return this.search('templates', searchFunction);
    }

    searchInNotificationTemplates(){
        const searchFunction = (element, searchValue)=>{
            let checkName = element.name ? element.name.toLowerCase().indexOf(searchValue) !== -1 : false;
            let checkType = element.type ? element.type.toLowerCase().indexOf(searchValue) !== -1 : false;
            return checkName || checkType;
        }
        return this.search('notificationTemplates', searchFunction);
    }

}