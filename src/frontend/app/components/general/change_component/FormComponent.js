import React from 'react';

import styles from '@themes/default/general/form_component.scss';
import Form from "@change_component/Form";
import {isArray, isEmptyObject} from "@utils/app";
import {API_REQUEST_STATE} from "@utils/constants/app";

class FormComponent extends React.Component{
    constructor(props) {
        super(props);
        let onlyInputs = [];
        for(let i = 0; i < props.contents.length; i++){
            if(isArray(props.contents[i])){
                for(let j = 0; j < props.contents[i].length; j++){
                    onlyInputs = onlyInputs.concat(props.contents[i][j].inputs);
                }
            } else{
                onlyInputs = onlyInputs.concat(props.contents[i].inputs);
            }
        }
        let entity = [];
        if(isEmptyObject(props.entity)){
            entity = this.getInputsState(onlyInputs);
        } else{
            entity = props.entity;
        }
        for(let i = 0; i < onlyInputs.length; i++){
            if(onlyInputs[i].hasOwnProperty('callback')){
                if(typeof onlyInputs[i].callback === 'function'){
                    onlyInputs[i].callback(entity[onlyInputs[i].name]);
                }
            }
        }
        this.state = {
            entity,
            page: 0,
            hasError: false,
            hasRequired: false,
            isValidated: true,
            focusedInput: {name: '', label: ''},
            validationMessage: '',
            makingRequest: false,
            contentsLength: props.contents ? props.contents.length : 0,
        };
    }

    getInputsState(inputs){
        let obj = {};
        if(Array.isArray(inputs)) {
            inputs.forEach(input => {
                return input.hasOwnProperty('defaultValue') ? obj[input.name] = input.defaultValue : obj[input.name] = '';
            });
        }
        return obj;
    }

    updateEntity(entity){
        this.setState({
            entity,
            focusedInput: {name: '', label: ''},
        });
    }

    render(){
        const {entity} = this.state;
        const {contents, breadcrumbsItems} = this.props;
        return(
            <div className={styles.form_component}>
                {
                    contents.map((form, key) => {
                        if(isArray((form))){
                            return(
                                <div className={styles.subform}>
                                    {
                                        form.map((subform, key2) => {
                                            const inputs = contents[key][key2].inputs;
                                            const breadcrumbItem = breadcrumbsItems[key][key2];
                                            return (
                                                <Form
                                                    key={key}
                                                    isSubForm={true}
                                                    breadcrumbItem={breadcrumbItem}
                                                    inputs={inputs}
                                                    entity={entity}
                                                    updateEntity={::this.updateEntity}
                                                />
                                            );
                                        })
                                    }
                                </div>
                            )
                        } else {
                            const inputs = contents[key].inputs;
                            const breadcrumbItem = breadcrumbsItems[key];
                            return (
                                <Form
                                    key={key}
                                    isSubForm={false}
                                    breadcrumbItem={breadcrumbItem}
                                    /*clearValidationMessage={::this.clearValidationMessage}*/
                                    inputs={inputs}
                                    entity={entity}
                                    updateEntity={::this.updateEntity}/*
                                    focusedInput={focusedInput.name}
                                    setFocusInput={::this.setFocusInput}
                                    renderValidationMessage={::this.renderValidationMessage}*/
                                />
                            );
                        }
                    })
                }
            </div>
        );
    }
}
FormComponent.defaultProps = {
    entity: {},
    type: 'add',
    isActionInProcess: API_REQUEST_STATE.INITIAL,
    initiateTestStatus: null,
    extraAction: '',
};

export default FormComponent;