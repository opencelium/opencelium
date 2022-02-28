import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import CConnectorItem from "@classes/components/content/connection/CConnectorItem";
import Input from "@basic_components/inputs/Input";
import RadioButtons from "@basic_components/inputs/RadioButtons";
import {
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
class AddParam extends React.Component{
    constructor(props) {
        super(props);
        let splitPath = props.path.split('.');
        let name = splitPath.length > 0 ? splitPath[splitPath.length - 1] : '';
        this.state = {
            name,
            type: '',
            isOpenedForm: false,
            nameError: '',
            typeError: '',
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {name} = this.state;
        const {updatingInvokerMethod, method, updateConnection, cleanMethod, connector, selectedMethod, changeInputValue, path} = this.props;
        if(updatingInvokerMethod === API_REQUEST_STATE.FINISH && method !== null){
            let invoker = connector.invoker;
            invoker.replaceOperation(method);
            connector.invoker = invoker;
            selectedMethod.response.success.body.fields = method.response.success.body.fields;
            updateConnection();
            cleanMethod();
            if(changeInputValue){
                let splitPath = path.split('.');
                const pathValueWithoutName = subArrayToString(splitPath, '.', 0);
                setTimeout(() => changeInputValue(`${pathValueWithoutName}${pathValueWithoutName !== '' ? '.' : ''}${name}`), 100);
            }
            this.toggleForm();
        }
    }

    toggleForm(){
        const {isOpenedForm} = this.state;
        const {toggleCallback} = this.props;
        if(toggleCallback){
            toggleCallback(!isOpenedForm);
        }
        let splitPath = this.props.path.split('.');
        let newName = splitPath.length > 0 ? splitPath[splitPath.length - 1] : '';
        this.setState({
            isOpenedForm: !this.state.isOpenedForm,
            name: newName,
            type: '',
            nameError: '',
            typeError: '',
        });
    }

    setName(name){
        this.setState({
            name,
            nameError: '',
        });
    }

    setType(type){
        this.setState({
            type,
            typError: '',
        });
    }

    validate(){
        const {name, type} = this.state;
        if(name.trim() === ''){
            this.setState({nameError: 'Name is a required field'})
            setFocusById('add_param_input_name');
            return false;
        }
        if(type === ''){
            this.setState({typeError: 'Type is a required field'})
            setFocusById('add_param_input_type');
            return false;
        }
        return true;
    }

    updateMethod(){
        const {name, type} = this.state;
        const {path, updateMethod, selectedMethod} = this.props;
        if(this.validate()){
            const invokerName = selectedMethod.invoker.name;
            let splitPath = path.split('.');
            const pathValueWithoutName = subArrayToString(splitPath, '.', 0).replace(/(\[(.(?!\.))+\])/g, '[]');
            let dataPath = `(response.success)${splitPath.length > 1 ? `.${pathValueWithoutName}` : ''}`;
            let newName = name;
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
        const {name, type, isOpenedForm, nameError, typeError} = this.state;
        const {id, updatingInvokerMethod} = this.props;
        return(
            <React.Fragment>
                <div className={styles.param_buttons}>
                    <Button id={id} icon={updatingInvokerMethod === API_REQUEST_STATE.START ? 'loading' : 'add'} onClick={() => this.toggleForm()} iconSize={'13px'}/>
                </div>
                <Dialog
                    actions={[{label: 'Add', onClick: () => this.updateMethod()}, {label: 'Cancel', onClick: () => this.toggleForm()}]}
                    active={isOpenedForm}
                    toggle={() => this.toggleForm()}
                    title={'Add Param'}
                >
                    <Input id={'add_param_input_name'} error={nameError} required={true} onChange={(a) => this.setName(a)} value={name} icon={'title'} label={'Name'}/>
                    <RadioButtons
                        error={typeError}
                        required={true}
                        label={'Type'}
                        icon={'text_format'}
                        value={type}
                        handleChange={(a) => this.setType(a)}
                        radios={[
                            {
                                id: 'add_param_input_type',
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

AddParam.propTypes = {
    connector: PropTypes.instanceOf(CConnectorItem).isRequired,
    path: PropTypes.string.isRequired,
    updateConnection: PropTypes.func.isRequired,
}

export default AddParam;