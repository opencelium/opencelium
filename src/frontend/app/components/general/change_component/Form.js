import React from 'react';

import styles from '@themes/default/general/form_component.scss';
import FormSection from "@change_component/FormSection";
import {isArray, isEmptyObject} from "@utils/app";
import {API_REQUEST_STATE} from "@utils/constants/app";
import {Col, Row} from "react-grid-system";
import ListHeader from "@components/general/list_of_components/Header";
import AddButton from "@components/general/list_of_components/AddButton";
import ListButton from "@components/general/view_component/ListButton";

class Form extends React.Component{
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

    clearValidationMessage(){

    }

    render(){
        const {entity} = this.state;
        const {contents, translations, permissions} = this.props;
        return(
            <Row id={'form_component'}>
                <Col sm={12}>
                    <div style={{marginBottom: '50px'}}>
                        <ListHeader header={translations.header}/>
                        <div className={styles.buttons_panel}>
                            <AddButton
                                permission={permissions.CREATE}
                                title={<span>{translations.add_button.title}</span>}
                                link={translations.add_button.link}
                            />
                            <ListButton
                                title={translations.list_button.title}
                                link={translations.list_button.link}
                                permission={permissions.READ}
                            />
                        </div>
                        <div className={styles.form_component}>
                            {
                                contents.map((form, key1) => {
                                    if(isArray((form))){
                                        return(
                                            <div key={key1} className={styles.subform}>
                                                {
                                                    form.map((subform, key2) => {
                                                        const inputs = contents[key1][key2].inputs;
                                                        return (
                                                            <FormSection
                                                                key={`${key1}_${key2}`}
                                                                isSubFormSection={true}
                                                                header={contents[key1][key2].header}
                                                                visible={contents[key1][key2].visible}
                                                                inputs={inputs}
                                                                entity={entity}
                                                                updateEntity={::this.updateEntity}
                                                                clearValidationMessage={::this.clearValidationMessage}
                                                            />
                                                        );
                                                    })
                                                }
                                            </div>
                                        )
                                    } else {
                                        const inputs = contents[key1].inputs;
                                        return (
                                            <FormSection
                                                key={key1}
                                                isSubFormSection={false}
                                                header={contents[key1].header}
                                                visible={contents[key1].visible}
                                                inputs={inputs}
                                                entity={entity}
                                                updateEntity={::this.updateEntity}
                                                clearValidationMessage={::this.clearValidationMessage}
                                            />
                                        );
                                    }
                                })
                            }
                        </div>
                    </div>
                </Col>
            </Row>
        );
    }
}
Form.defaultProps = {
    entity: {},
    type: 'add',
    isActionInProcess: API_REQUEST_STATE.INITIAL,
    initiateTestStatus: null,
    extraAction: '',
};

export default Form;