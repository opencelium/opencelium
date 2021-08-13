import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import styles from '@themes/default/general/form_component.scss';
import FormSection from "@change_component/FormSection";
import {isArray, isEmptyObject} from "@utils/app";
import {Col, Row} from "react-grid-system";
import ListHeader from "@components/general/list_of_components/Header";
import ListButton from "@components/general/view_component/ListButton";
import {ActionButton, SubFormSections} from "@change_component/FormComponents";
import {setConnectionData} from "@actions/connection_overview_2/set";


@connect(null, {setConnectionData})
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
        if(!props.entity || isEmptyObject(props.entity)){
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

    updateEntity(entity, name){
        this.setState({
            entity,
        });
        this.props.setConnectionData(entity);
        this.props.clearValidationMessage(name);
    }

    doAction(){
        const {entity} = this.state;
        const {action} = this.props;
        if(typeof action === 'function'){
            action(entity);
        }
    }

    render(){
        const {entity} = this.state;
        const {contents, translations, permissions, isActionInProcess} = this.props;
        const hasActionButton = translations && translations.action_button;
        const hasListButton = translations && translations.list_button;
        return(
            <Row id={'form_component'}>
                <Col sm={12}>
                    <div style={{marginBottom: '50px'}}>
                        <ListHeader header={translations.header}/>
                        <div className={styles.buttons_panel}>
                            {hasActionButton &&
                                <ActionButton
                                    {...this.props}
                                    doAction={::this.doAction}
                                    isActionInProcess={isActionInProcess}
                                />
                            }
                            {hasListButton &&
                                <ListButton
                                    title={translations.list_button.title}
                                    link={translations.list_button.link}
                                    permission={permissions.READ}
                                />
                            }
                        </div>
                        <div className={styles.form_component}>
                            {
                                contents.map((form, key1) => {
                                    if(isArray((form))){
                                        return (
                                            <SubFormSections
                                                key={key1}
                                                key1={key1}
                                                form={form}
                                                contents={contents}
                                                entity={entity}
                                                updateEntity={::this.updateEntity}
                                            />
                                        );
                                    } else {
                                        return (
                                            <FormSection
                                                key={key1}
                                                isSubFormSection={false}
                                                content={form}
                                                entity={entity}
                                                updateEntity={::this.updateEntity}
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

Form.propTypes = {
    type: PropTypes.string,
    contents: PropTypes.array,
    translations: PropTypes.shape({
        header: PropTypes.shape({
            title: PropTypes.string.isRequired,
            onHelpClick: PropTypes.func,
        }),
        list_button: PropTypes.shape({
            title: PropTypes.string.isRequired,
            link: PropTypes.string.isRequired,
        }),
        action_button: PropTypes.shape({
            title: PropTypes.string.isRequired,
            link: PropTypes.string.isRequired,
        })
    }),
    isActionInProcess: PropTypes.bool,
    permissions: PropTypes.object,
    clearValidationMessage: PropTypes.func,
    action: PropTypes.func,
}

Form.defaultProps = {
    type: 'add',
    contents: [],
    isActionInProcess: false,
    clearValidationMessage: () => {},
    action: () => {},
};

export default Form;