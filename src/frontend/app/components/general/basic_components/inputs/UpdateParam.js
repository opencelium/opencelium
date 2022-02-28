import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import CConnectorItem from "@classes/components/content/connection/CConnectorItem";
import RadioButtons from "@basic_components/inputs/RadioButtons";
import CMethodItem, {
    FIELD_TYPE_ARRAY,
    FIELD_TYPE_OBJECT,
    FIELD_TYPE_STRING
} from "@classes/components/content/connection/method/CMethodItem";
import Button from "@basic_components/buttons/Button";
import styles from '@themes/default/general/basic_components.scss';
import Dialog from "@basic_components/Dialog";
import {setFocusById, subArrayToString} from "@utils/app";
import {updateMethod, cleanMethod} from "@actions/invokers/update";
import {API_REQUEST_STATE} from "@utils/constants/app";
import {ATTRIBUTES_MARK, ATTRIBUTES_PROPERTY} from "@classes/components/content/invoker/CBody";

function mapStateToProps(state){
    const invokerReducer = state.get('invokers');
    return{
        updatingInvokerMethod: invokerReducer.get('updatingInvokerMethod'),
        method: invokerReducer.get('method'),
    };
}

@connect(mapStateToProps, {updateMethod, cleanMethod})
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
        const {updatingInvokerMethod, method, updateConnection, cleanMethod, selectedConnector, selectedMethod, connection} = this.props;
        if(updatingInvokerMethod === API_REQUEST_STATE.FINISH && method !== null){
            let invoker = selectedConnector.invoker;
            invoker.replaceOperation(method);
            selectedConnector.invoker = invoker;
            selectedMethod.response.success.body.fields = method.response.success.body.fields;
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
        const {name, path, updateMethod, selectedMethod} = this.props;
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
            updateMethod({invokerName, methodData: data});
        }
    }

    render(){
        const {type, isOpenedForm, typeError} = this.state;
        const {id, updatingInvokerMethod} = this.props;
        return(
            <React.Fragment>
                <div className={styles.param_buttons}>
                    <Button id={id} icon={isOpenedForm && updatingInvokerMethod === API_REQUEST_STATE.START ? 'loading' : 'create'} onClick={() => this.toggleForm()} iconSize={'13px'}/>
                </div>
                <Dialog
                    actions={[{label: 'Update', onClick: () => this.updateMethod()}, {label: 'Cancel', onClick: () => this.toggleForm()}]}
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