
/*
 * Copyright (C) <2022>  <becon GmbH>
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

import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import CConnectorItem from "@entity/connection/components/classes/components/content/connection/CConnectorItem";
import RadioButtons from "@entity/connection/components/components/general/basic_components/inputs/RadioButtons";
import CMethodItem, {
    FIELD_TYPE_ARRAY,
    FIELD_TYPE_OBJECT,
    FIELD_TYPE_STRING
} from "@entity/connection/components/classes/components/content/connection/method/CMethodItem";
import Button from "@entity/connection/components/components/general/basic_components/buttons/Button";
import styles from '@entity/connection/components/themes/default/general/basic_components.scss';
import Dialog from "@entity/connection/components/components/general/basic_components/Dialog";
import {setFocusById, subArrayToString} from "@application/utils/utils";
import {cleanMethod} from "@entity/invoker/redux_toolkit/slices/InvokerSlice";
import {updateOperation} from "@entity/invoker/redux_toolkit/action_creators/InvokerCreators";
import {ATTRIBUTES_MARK, ATTRIBUTES_PROPERTY} from "@entity/connection/components/classes/components/content/invoker/CBody";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";

function mapStateToProps(state){
    const invokerReducer = state.invokerReducer;
    return{
        updatingOperation: invokerReducer.updatingOperation,
        operation: invokerReducer.operation,
    };
}

@connect(mapStateToProps, {updateOperation, cleanMethod})
class UpdateParam extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            type: props.type,
            isOpenedForm: false,
            typeError: '',
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {isOpenedForm} = this.state;
        const {updatingOperation, operation, updateConnection, cleanMethod, selectedConnector, selectedMethod, connection} = this.props;
        if(updatingOperation === API_REQUEST_STATE.FINISH && operation !== null){
            let invoker = selectedConnector.invoker;
            invoker.replaceOperation(operation);
            selectedConnector.invoker = invoker;
            selectedMethod.response.success.body.fields = operation.response.success.body.fields;
            updateConnection(connection);
            cleanMethod();
            if(isOpenedForm){
                this.toggleForm();
            }
        }
    }

    toggleForm(){
        const {isOpenedForm, type} = this.state;
        const {toggleCallback} = this.props;
        this.setState({
            isOpenedForm: !isOpenedForm,
            typeError: '',
        }, () => {
            if(toggleCallback){
                toggleCallback(!isOpenedForm);
            }
        });
    }

    setType(type){
        this.setState({
            type,
            typError: '',
        });
    }

    validate(){
        const {type} = this.state;
        if(type === ''){
            this.setState({typeError: 'Type is a required field'})
            setFocusById('update_param_input_type');
            return false;
        }
        return true;
    }

    updateMethod(){
        const {type} = this.state;
        const {name, path, updateOperation, selectedMethod} = this.props;
        if(this.validate()){
            const invokerName = selectedMethod.invoker.name;
            let splitPath = path.split('.');
            const pathValueWithoutName = subArrayToString(splitPath, '.', 0).replace(/(\[(.(?!\.))+\])/g, '[]');
            let dataPath = `(response.success)${splitPath.length > 1 ? `.${pathValueWithoutName}` : ''}`;
            let newName = name.replace(/(\[(.(?!\.))+\])/g, '');
            if(name[0] === ATTRIBUTES_MARK){
                dataPath += `.${ATTRIBUTES_PROPERTY}`;
                newName = name.substr(1, name.length);
            }
            const data = {
                method: selectedMethod.name,
                path: dataPath,
                fields: [
                    {
                        name: newName,
                        type,
                        value: null,
                    }
                ]
            };
            updateOperation({invokerName, methodData: data});
        }
    }

    render(){
        const {type, isOpenedForm, typeError} = this.state;
        const {id, updatingOperation} = this.props;
        const isLoading = isOpenedForm && updatingOperation === API_REQUEST_STATE.START;
        return(
            <React.Fragment>
                <div className={styles.param_buttons}>
                    <Button id={id} icon={'create'} onClick={() => this.toggleForm()} iconSize={'13px'}/>
                </div>
                <Dialog
                    actions={[{label: 'Update', isLoading, onClick: () => this.updateMethod()}, {label: 'Cancel', onClick: () => this.toggleForm()}]}
                    active={isOpenedForm}
                    toggle={() => this.toggleForm()}
                    title={'Update Param'}
                >
                    <RadioButtons
                        error={typeError}
                        required={true}
                        label={'Type'}
                        icon={'text_format'}
                        value={type}
                        handleChange={(a) => this.setType(a)}
                        radios={[
                            {
                                id: 'update_param_input_type',
                                label: 'String',
                                value: FIELD_TYPE_STRING,
                            },{
                                label: 'Array',
                                value: FIELD_TYPE_ARRAY,
                            },{
                                label: 'Object',
                                value: FIELD_TYPE_OBJECT,
                            }
                        ]}/>
                </Dialog>
            </React.Fragment>

        );
    }
}

UpdateParam.propTypes = {
    selectedConnector: PropTypes.instanceOf(CConnectorItem).isRequired,
    selectedMethod: PropTypes.instanceOf(CMethodItem).isRequired,
    path: PropTypes.string.isRequired,
    updateConnection: PropTypes.func.isRequired,
}

export default UpdateParam;