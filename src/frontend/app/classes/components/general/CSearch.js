import {capitalize, isString, searchByNameFunction} from "@utils/app";
import CUserGroup from "@classes/components/content/user_group/CUserGroup";

export class CSearch{
    searchValue = '';
    componentName = '';
    sources = {};

    constructor(searchData) {
        this.searchValue = searchData?.searchValue.toLowerCase() || '';
        this.componentName = searchData?.componentName.toLowerCase() || '';
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

    searchInConnectors(){
        const source = this.sources['connectors'];
        let result = [];
        const searchFunction = (element, searchValue)=>{
            let checkName = element.name ? element.name.indexOf(searchValue.toLowerCase()) !== -1 : false;
            let checkDescription = element.description ? element.description.indexOf(searchValue.toLowerCase()) !== -1 : false;
            let checkInvokerName = element.invoker.name ? element.invoker.name.indexOf(searchValue.toLowerCase()) !== -1 : false;
            return checkName || checkDescription || checkInvokerName;
        }
        if(source){
            result = source.filter((value) => searchFunction(value, this.searchValue));
        }
        return {connectors: result};
    }

    searchInConnections(){
        const source = this.sources['connections'];
        let result = [];
        if(source){
            for(let i = 0; i < source.length; i++){

            }
        }
        return {connections: result};
    }

    searchInSchedules(){
        const source = this.sources['schedules'];
        let result = [];
        if(source){
            for(let i = 0; i < source.length; i++){

            }
        }
        return {schedules: result};
    }

    searchInUsers(){
        const source = this.sources['users'];
        let result = [];
        if(source){
            for(let i = 0; i < source.length; i++){

            }
        }
        return {users: result};
    }

    searchInUserGroups(){
        const source = this.sources['userGroups'];
        let result = [];
        if(source){
            for(let i = 0; i < source.length; i++){

            }
        }
        return {userGroups: result};
    }

    searchInInvokers(){
        const source = this.sources['invokers'];
        let result = [];
        if(source){
            for(let i = 0; i < source.length; i++){

            }
        }
        return {invokers: result};
    }

    searchInTemplates(){
        const source = this.sources['templates'];
        let result = [];
        if(source){
            for(let i = 0; i < source.length; i++){

            }
        }
        return {templates: result};
    }

    searchInNotificationTemplates(){
        const source = this.sources['notificationTemplates'];
        let result = [];
        if(source){
            for(let i = 0; i < source.length; i++){

            }
        }
        return {notificationTemplates: result};
    }

}