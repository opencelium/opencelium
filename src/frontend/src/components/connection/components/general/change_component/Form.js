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
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import styles from '@themes/default/general/form_component.scss';
import FormSection from "@change_component/FormSection";
import {isArray, isEmptyObject} from "@utils/app";
import ListHeader from "@components/general/list_of_components/Header";
import ListButton from "@components/general/view_component/ListButton";
import {ActionButton, SubFormSections} from "@change_component/FormComponents";
import CancelButton from "@components/general/view_component/CancelButton";

import {setConnectionData} from "@slice/connection/ConnectionSlice";
import CConnection from "@classes/components/content/connection/CConnection";
import Title from "@molecule/collection_title/Title";

function mapStateToProps(state){
    const authUser = state.authReducer.authUser;
    return {
        authUser,
    }
}

@connect(mapStateToProps, {setConnectionData})
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
        let connection = entity instanceof CConnection ? entity.getObjectForConnectionOverview() : entity;
        this.props.setConnectionData({connection});
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
        const {contents, translations, permissions, isActionInProcess, additionalButtons, clearValidationMessage} = this.props;
        const hasActionButton = translations && translations.action_button;
        const hasListButton = translations && translations.list_button;
        const hasCancelButton = translations && translations.cancel_button;
        return(
            <div style={{margin: '20px 0', padding: 0, paddingBottom: '30px'}}>
                <Title title={translations.header}/>
                <div className={styles.buttons_panel}>
                    {hasActionButton &&
                        <ActionButton
                            {...this.props}
                            doAction={(a) => this.doAction(a)}
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
                    {
                        additionalButtons(entity)
                    }
                    {hasCancelButton &&
                        <CancelButton
                            title={translations.cancel_button.title}
                            link={translations.cancel_button.link}
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
                                        clearValidationMessage={clearValidationMessage}
                                        updateEntity={(a, b) => this.updateEntity(a, b)}
                                    />
                                );
                            } else {
                                return (
                                    <FormSection
                                        key={key1}
                                        isSubFormSection={false}
                                        content={form}
                                        entity={entity}
                                        updateEntity={(a, b) => this.updateEntity(a, b)}
                                        clearValidationMessage={clearValidationMessage}
                                    />
                                );
                            }
                        })
                    }
                </div>
            </div>
        );
    }
}

Form.propTypes = {
    type: PropTypes.string,
    contents: PropTypes.array,
    translations: PropTypes.shape({
        header: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.object,
        ]),
        list_button: PropTypes.shape({
            title: PropTypes.string.isRequired,
            link: PropTypes.string.isRequired,
        }),
        cancel_button: PropTypes.shape({
            title: PropTypes.string.isRequired,
            link: PropTypes.string.isRequired,
        }),
        action_button: PropTypes.shape({
            title: PropTypes.string.isRequired,
            link: PropTypes.string,
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
    additionalButtons: () => {},
};

export default Form;