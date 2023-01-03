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

import React, {Component} from 'react';
import PropTypes from 'prop-types';

import Input from "@entity/connection/components/components/general/basic_components/inputs/Input";
import styles from '@entity/connection/components/themes/default/general/change_component.scss';
import Button from "@entity/connection/components/components/general/basic_components/buttons/Button";
import Dialog from "@entity/connection/components/components/general/basic_components/Dialog";
import {setFocusById} from "@application/utils/utils";
import TooltipFontIcon from "@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon";


const PARAMS_LIMIT = 3;
const params = [{name: 'site', value: 'becon'}, {name: 'name', value: 'Jakob'}, {name: 'new', value: 'value'},
        {name: 'pi', value: '3.14'}, {name: 'world', value: 'global'}, {name: 'weather', value: 'hot'}
    ];
/**
 * Add Param Component
 */
class AddParam extends Component{

    constructor(props){
        super(props);
        this.state = {
            visibleAddParamDialog: false,
            paramsIterator: 1,
            newOCParamName: '',
            newOCParamValue: '',
            ...this.getParamsStates()
        };
    }

    getParamsStates(){
        let result = {};
        for(let i = 0; i < params.length; i++){
            result[`${params[i].name}_name`] = params[i].name;
            result[`${params[i].name}_value`] = params[i].value;
        }
        return result;
    }

    increaseIterator(){
        this.setState({paramsIterator: this.state.paramsIterator + 1});
    }

    decreaseIterator(){
        this.setState({paramsIterator: this.state.paramsIterator - 1});
    }

    /**
     * to change template name
     */
    changeAddNewParamName(newOCParamName){
        this.setState({newOCParamName});
    }

    /**
     * to change template template
     */
    changeAddNewParamValue(newOCParamValue){
        this.setState({newOCParamValue});
    }

    change(propName, propValue, value){
        this.setState({[propName]: propValue});
    }

    /**
     * to show/hide param dialog
     */
    toggleAddParamDialog(){
        this.setState({
            visibleAddParamDialog: !this.state.visibleAddParamDialog,
        });
    }

    add(){
        params.push({name: this.state.newOCParamName, value: this.state.newOCParamValue});
        this.setState({
            newOCParamName: '',
            newOCParamValue: '',
            [`${this.state.newOCParamName}_name`]: this.state.newOCParamName,
            [`${this.state.newOCParamName}_value`]: this.state.newOCParamValue,
        });
        setFocusById('param_name', 1);
        if(this.getParams().length === PARAMS_LIMIT){
            this.increaseIterator();
        }
    }

    deleteParam(name){
        const {paramsIterator} = this.state;
        let index = params.findIndex(p => p.name === name);
        if(index !== -1){
            params.splice(index, 1);
        }
        this.setState({
            [`${name}_name`]: '',
            [`${name}_value`]: '',
        });
        setFocusById('param_name', 100);
        if(this.getParams().length === 0 && paramsIterator > 1){
            this.decreaseIterator();
        }
    }

    /**
     * to add param
     */
    addParam(){
        this.toggleAddParamDialog();
    }

    getParams(){
        const {paramsIterator} = this.state;
        return params.slice((paramsIterator - 1) * PARAMS_LIMIT, (paramsIterator - 1) * PARAMS_LIMIT + PARAMS_LIMIT);
    }

    renderParams(){
        return this.getParams().map(param => {
            return (
                <div key={param.name}>
                    <Input
                        onChange={(value) => this.change(`${param.name}_name`, value)}
                        value={this.state[`${param.name}_name`]}
                        label={'Name'}
                        name={'param_name'}
                        theme={{input: styles.add_param_existed_input_name}}
                        autoFocus
                    />
                    <Input
                        onChange={(value) => this.change(`${param.name}_value`, value)}
                        value={this.state[`${param.name}_value`]}
                        label={'Value'}
                        name={'param_value'}
                        theme={{input: styles.add_param_existed_input_value}}
                    />
                    <TooltipFontIcon tooltip={'Delete'} value={'delete'} className={styles.add_param_existed_delete} onClick={() => this.deleteParam(`${param.name}`)}/>
                </div>
            )
        });
    }

    renderNavigation(){
        const {paramsIterator} = this.state;
        const isPrevDisable = (paramsIterator - 1) * PARAMS_LIMIT <= 0;
        const isNextDisable = paramsIterator * PARAMS_LIMIT >= params.length;
        if(params.length <= PARAMS_LIMIT){
            return null;
        }
        return(
            <div className={styles.navigation_arrows}>
                <TooltipFontIcon tooltip={'Previous'} value={'keyboard_arrow_up'} onClick={isPrevDisable ? null : (a) => this.decreaseIterator(a)}
                                 className={`${styles.navigation_arrow_prev} ${isPrevDisable ? styles.navigation_arrow_disable : ''}`}/>
                <TooltipFontIcon tooltip={'Next'} value={'keyboard_arrow_down'} onClick={isNextDisable ? null : (a) => this.increaseIterator(a)}
                                 className={`${styles.navigation_arrow_next} ${isNextDisable ? styles.navigation_arrow_disable : ''}`}/>
            </div>
        )
    }

    render(){
        const {visibleAddParamDialog, newOCParamName, newOCParamValue} = this.state;
        const {data, authUser} = this.props;
        const {templateLabels} = data;
        if(!templateLabels){
            return null;
        }
        return (
            <div className={styles.add_param_navigation}>
                <Button authUser={authUser} title={'Add Param'} onClick={(a) => this.toggleAddParamDialog(a)}/>
                <Dialog
                    actions={[{label: 'Ok', onClick: (a) => this.addParam(a), id: 'add_template_ok'}, {label: 'Cancel', onClick: (a) => this.toggleAddParamDialog(a), id: 'add_template_cancel'}]}
                    active={visibleAddParamDialog}
                    toggle={(a) => this.toggleAddParamDialog(a)}
                    title={'Add Param'}
                    theme={{title: styles.template_dialog_title}}
                >
                    {this.renderParams()}
                    {this.renderNavigation()}
                    <div>
                        <Input
                            onChange={(a) => this.changeAddNewParamName(a)}
                            value={newOCParamName}
                            label={'Name'}
                            name={'param_name'}
                            id={'param_name'}
                            theme={{input: styles.add_param_input_name}}
                            autoFocus
                        />
                        <Input
                            onChange={(a) => this.changeAddNewParamValue(a)}
                            value={newOCParamValue}
                            label={'Value'}
                            name={'param_value'}
                            theme={{input: styles.add_param_input_value}}
                        />
                        <Button authUser={authUser} title={'Add'} onClick={(a) => this.add(a)} className={styles.add_param_button}/>
                    </div>
                </Dialog>
            </div>
        );
    }
}

AddParam.propTypes = {
    authUser: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
    entity: PropTypes.object.isRequired,
};

export default AddParam;