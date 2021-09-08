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


/**
 * common component that has a list with checkboxes
 *
 */
export function ComponentHasCheckboxes(){
    return function (Component) {
        return class extends Component{

            constructor(props) {
                super(props);

                this.state = {
                    checks: [],
                    allChecked: false,
                }
            }

            /**
             * to set all checkboxes true or false
             */
            setAllChecked(value){
                this.setState({
                    allChecked: value,
                });
            }

            /**
             * to set checks state with data
             */
            checkOneEntity(e, data, callback = null){
                let {checks, allChecked} = this.state;
                let index = checks.findIndex(c => c.id === data.id);
                if(typeof checks[index] === 'undefined') {
                    checks.push({value: true, id: data.id});
                } else {
                    let val = !checks[index].value;
                    checks[index] = {value: val, id: data.id};
                }
                allChecked = this.isAllChecked(checks);
                this.setState({checks, allChecked}, typeof callback === 'function' ? callback : () => {});
            }

            /**
             * to delete data from checks state
             */
            deleteCheck(data){
                let {checks} = this.state;
                let allChecked = true;
                let index = checks.findIndex(c => c.id === data.key);
                checks.splice(index, 1);
                if(checks.length > 0) {
                    for (let i = 0; i < checks.length; i++) {
                        if (!checks[i].value) {
                            allChecked = false;
                        }
                    }
                } else{
                    allChecked = false;
                }
                this.setState({checks, allChecked});
            }

            /**
             * to set checks state with item id
             */
            checkAllEntities(callback = null){
                let entities = this.props[this.props.entitiesName];
                let checks = [];
                for(let i = 0; i < entities.length; i++){
                    checks.push({value: !this.state.allChecked, id: entities[i][this.props.entityIdName]});
                }
                this.setState({checks, allChecked: !this.state.allChecked}, typeof callback === 'function' ? callback : () => {});
            }

            /**
             * to check if all checks are checked
             */
            isAllChecked(checks){
                let entities = this.props[this.props.entitiesName];
                if(entities.length !== checks.length){
                    return false;
                }
                for(let i = 0; i < checks.length; i++){
                    if(!checks[i].value){
                        return false;
                    }
                }
                return true;
            }

            isOneChecked(){
                let {checks} = this.state;
                for(let i = 0; i < checks.length; i++){
                    if(checks[i].value){
                        return true;
                    }
                }
                return false;
            }

            render(){
                const {checks, allChecked} = this.state;
                return <Component
                    {...this.props}
                    checkAllEntities={::this.checkAllEntities}
                    deleteCheck={::this.deleteCheck}
                    checkOneEntity={::this.checkOneEntity}
                    setAllChecked={::this.setAllChecked}
                    isOneChecked={::this.isOneChecked}
                    checks={checks}
                    allChecked={allChecked}
                />;
            }
        };
    };
}
